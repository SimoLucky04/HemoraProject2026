import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Swipeable } from 'react-native-gesture-handler';
import MapView, { Marker, Region } from 'react-native-maps';
import { AppButton } from '@components/AppButton';
import { Card } from '@components/Card';
import { nestedScreenEdges, Screen } from '@components/Screen';
import { Badge, Muted, Row, SectionTitle } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import type { DonationsStackParamList } from '@navigation/MainTabs';
import { Booking, CollectionCenter } from '@app-types';
import { colors, radius, spacing } from '@theme';
import { formatItalianDate } from '@utils/date';

type Navigation = NativeStackNavigationProp<DonationsStackParamList>;
type MapPoint = { latitude: number; longitude: number };
type CenterWithDistance = CollectionCenter & { distanceKm: number };

const FALLBACK_LOCATION: MapPoint = { latitude: 40.6824, longitude: 14.7681 };

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: MapPoint, to: MapPoint) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1)} km`;
}

// Calcola una regione che racchiude tutti i punti, cosi la mappa mostra ogni
// centro e non solo uno (con un minimo di zoom per evitare delta troppo piccoli).
function regionForPoints(points: MapPoint[]): Region {
  if (points.length === 0) {
    return { ...FALLBACK_LOCATION, latitudeDelta: 0.4, longitudeDelta: 0.4 };
  }
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.08),
    longitudeDelta: Math.max((maxLon - minLon) * 1.6, 0.08),
  };
}

export function BookingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, refreshCenters, removeBooking, reconcileDueBookings } = useHemora();

  // Aggiorna prenotazioni/storico convertendo gli slot ormai passati.
  useFocusEffect(
    useCallback(() => {
      reconcileDueBookings();
    }, [reconcileDueBookings])
  );
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<MapPoint>(FALLBACK_LOCATION);
  const [locationSource, setLocationSource] = useState<'gps' | 'demo'>('demo');

  const [initialRegion] = useState<Region>(() =>
    regionForPoints(state.centers.map((center) => ({ latitude: center.latitude, longitude: center.longitude })))
  );

  useEffect(() => {
    let cancelled = false;

    // Carica SEMPRE tutti i centri (nessun filtro per raggio): cosi l'insieme di
    // pin sulla mappa resta stabile tra un'apertura e l'altra. La posizione GPS
    // serve solo a calcolare le distanze per le etichette/ordinamento, mai a
    // nascondere dei centri.
    refreshCenters().catch(() => {
      // Local-first: se il backend e offline teniamo i centri gia in memoria.
    });

    async function loadLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return; // Resta sulla posizione demo (Salerno).
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (cancelled) return;

      setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationSource('gps');
    }

    loadLocation().catch(() => {
      setLocationSource('demo');
      setUserLocation(FALLBACK_LOCATION);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const centersWithDistance = useMemo<CenterWithDistance[]>(() => {
    return state.centers
      .map((center) => ({
        ...center,
        distanceKm: distanceKm(userLocation, { latitude: center.latitude, longitude: center.longitude }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [state.centers, userLocation]);

  // Riadatta la mappa per inquadrare tutti i centri quando cambiano.
  useEffect(() => {
    if (state.centers.length === 0) return;
    const coordinates = state.centers.map((center) => ({ latitude: center.latitude, longitude: center.longitude }));
    if (locationSource === 'gps') coordinates.push(userLocation);
    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 56, right: 56, bottom: 56, left: 56 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [state.centers, locationSource, userLocation]);

  const sortedBookings = useMemo(() => {
    return [...state.bookings].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }, [state.bookings]);

  function openBooking(centerId?: string) {
    navigation.navigate('NuovaPrenotazione', centerId ? { centerId } : undefined);
  }

  function confirmDelete(booking: Booking) {
    Alert.alert(
      'Eliminare la prenotazione?',
      `${booking.centerName}\n${formatItalianDate(booking.dateTime)}`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            removeBooking(booking.id).catch((error) =>
              Alert.alert(
                'Eliminazione non riuscita',
                error instanceof Error ? error.message : 'Riprova più tardi.'
              )
            );
          },
        },
      ]
    );
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>

      <Card>
        <Row>
          <SectionTitle>Centri di raccolta</SectionTitle>
          <Badge>{state.centers.length}</Badge>
        </Row>
        <View style={styles.mapFrame}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={locationSource === 'gps'}
            showsMyLocationButton
          >
            {centersWithDistance.map((center) => (
              <Marker
                key={center.id}
                coordinate={{ latitude: center.latitude, longitude: center.longitude }}
                title={center.name}
                description={`${center.city} · ${formatDistance(center.distanceKm)} · tocca per prenotare`}
                pinColor={colors.primary}
                // Evita il flicker dei pin a ogni zoom/pan: il pin e statico,
                // quindi non serve ridisegnare la view nativa di continuo.
                tracksViewChanges={false}
                onCalloutPress={() => openBooking(center.id)}
                onPress={() => openBooking(center.id)}
              />
            ))}
          </MapView>
        </View>
        <Muted>
          {locationSource === 'gps'
            ? 'Distanze calcolate dalla tua posizione. Tocca un centro per prenotare.'
            : 'Permesso posizione non attivo: uso una posizione demo su Salerno. Tocca un centro per prenotare.'}
        </Muted>
      </Card>

      <AppButton
        title="Prenota una donazione"
        onPress={() => openBooking()}
        accessibilityHint="Apre la schermata per scegliere centro, giorno e orario"
      />

      <Card>
        <Row>
          <SectionTitle>Le tue prenotazioni</SectionTitle>
          <Badge>{state.bookings.length}</Badge>
        </Row>
        {sortedBookings.length === 0 ? (
          <Muted>Non hai ancora prenotazioni.</Muted>
        ) : (
          <>
            {sortedBookings.map((booking) => (
              <Swipeable
                key={booking.id}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    onPress={() => confirmDelete(booking)}
                    style={styles.deleteAction}
                    accessibilityRole="button"
                    accessibilityLabel={`Elimina prenotazione del ${formatItalianDate(booking.dateTime)}`}
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.surface} />
                    <Text style={styles.deleteActionText}>Elimina</Text>
                  </Pressable>
                )}
              >
                <View style={styles.bookingRow}>
                  <Text style={styles.itemTitle}>
                    {formatItalianDate(booking.dateTime)} · {new Date(booking.dateTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Muted>{booking.centerName} · {booking.type} · {booking.status}</Muted>
                </View>
              </Swipeable>
            ))}
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    height: 280,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  map: {
    flex: 1,
  },
  bookingRow: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    width: 104,
  },
  deleteActionText: {
    color: colors.surface,
    fontWeight: '900',
  },
});
