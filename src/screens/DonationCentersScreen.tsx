import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { nestedScreenEdges, Screen } from '../components/Screen';
import { Badge, Muted, Row, SectionTitle, Subtitle, Title } from '../components/TextBlocks';
import { useHemora } from '../context/HemoraContext';
import { CollectionCenter, DonationType } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatItalianDate, todayISO } from '../utils/date';

const DONATION_TYPES: DonationType[] = ['Sangue intero', 'Plasma', 'Piastrine'];
const SEARCH_RADIUS_KM = 30;
const FALLBACK_LOCATION = {
  latitude: 40.6824,
  longitude: 14.7681,
};

type MapPoint = {
  latitude: number;
  longitude: number;
};

type CenterWithDistance = CollectionCenter & {
  distanceKm: number;
};

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

export function DonationCentersScreen() {
  const { state, bookDonation, refreshCenters } = useHemora();
  const [bookingType, setBookingType] = useState<DonationType>('Sangue intero');
  const [userLocation, setUserLocation] = useState<MapPoint>(FALLBACK_LOCATION);
  const [locationSource, setLocationSource] = useState<'gps' | 'demo'>('demo');

  const sortedDonations = useMemo(() => {
    return [...state.donations].sort((a, b) => b.date.localeCompare(a.date));
  }, [state.donations]);

  const lastEligibility = sortedDonations[0]?.nextEligibilityDate;

  useEffect(() => {
    let cancelled = false;

    async function refreshNearbyCenters(location: MapPoint) {
      await refreshCenters({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: SEARCH_RADIUS_KM,
      });
    }

    async function loadLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        await refreshNearbyCenters(FALLBACK_LOCATION);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (cancelled) return;

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(location);
      setLocationSource('gps');
      await refreshNearbyCenters(location);
    }

    loadLocation().catch(() => {
      setLocationSource('demo');
      setUserLocation(FALLBACK_LOCATION);
      refreshNearbyCenters(FALLBACK_LOCATION);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const centersWithDistance = useMemo<CenterWithDistance[]>(() => {
    return state.centers
      .map((center) => ({
        ...center,
        distanceKm: distanceKm(userLocation, {
          latitude: center.latitude,
          longitude: center.longitude,
        }),
      }))
      .filter((center) => center.distanceKm <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [state.centers, userLocation]);

  const mapRegion = useMemo<Region>(
    () => ({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }),
    [userLocation],
  );

  function submitBooking(centerId: string) {
    const center = state.centers.find((item) => item.id === centerId);
    const minDate = lastEligibility && lastEligibility > todayISO() ? lastEligibility : todayISO();
    const booking = bookDonation({ centerId, type: bookingType, dateTime: `${minDate}T09:00:00` });
    Alert.alert('Prenotazione creata', `${center?.name ?? booking.centerName}\n${formatItalianDate(booking.dateTime)} alle 09:00`);
  }

  return (
    <Screen safeAreaEdges={nestedScreenEdges}>
      <Title>Centri raccolta</Title>
      <Subtitle>Centri reali in Campania ordinati per distanza, con prenotazione simulata del primo slot disponibile.</Subtitle>

      <Card>
        <SectionTitle>Tipo per prenotazione</SectionTitle>
        <View style={styles.optionRow}>
          {DONATION_TYPES.map((item) => (
            <AppButton key={item} title={item} onPress={() => setBookingType(item)} variant={bookingType === item ? 'primary' : 'ghost'} />
          ))}
        </View>
        <Muted>La prenotazione usa il primo slot disponibile simulato alle 09:00.</Muted>
      </Card>

      <Card>
        <Row>
          <SectionTitle>Centri entro {SEARCH_RADIUS_KM} km</SectionTitle>
          <Badge>{centersWithDistance.length}</Badge>
        </Row>
        <View style={styles.mapFrame}>
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
            region={mapRegion}
            showsUserLocation={locationSource === 'gps'}
            showsMyLocationButton
          >
            <Circle
              center={userLocation}
              radius={SEARCH_RADIUS_KM * 1000}
              strokeColor="rgba(190, 24, 93, 0.38)"
              fillColor="rgba(190, 24, 93, 0.08)"
            />
            <Marker coordinate={userLocation} title={locationSource === 'gps' ? 'La tua posizione' : 'Posizione demo'} pinColor={colors.primary} />
            {centersWithDistance.map((center) => (
              <Marker
                key={center.id}
                coordinate={{ latitude: center.latitude, longitude: center.longitude }}
                title={center.name}
                description={`${center.city} - ${formatDistance(center.distanceKm)}`}
              />
            ))}
          </MapView>
        </View>
        <Muted>
          {locationSource === 'gps'
            ? 'Distanze calcolate dalla posizione del dispositivo.'
            : 'Permesso posizione non attivo: uso una posizione demo su Salerno.'}
        </Muted>

        {centersWithDistance.map((center) => (
          <View key={center.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{center.name}</Text>
            <Muted>{center.address}, {center.city}{center.province ? ` (${center.province})` : ''} · {center.openingHours}</Muted>
            <Muted>Distanza: {formatDistance(center.distanceKm)}</Muted>
            <Muted>{center.phone}</Muted>
            {center.kind && <Muted>{center.kind} · Fonte: {center.sourceName ?? 'dataset curato'}</Muted>}
            {center.bookingMode === 'Simulata' && <Muted>Prenotazione demo: nessuna richiesta viene inviata alla struttura.</Muted>}
            <AppButton title="Prenota primo slot disponibile" onPress={() => submitBooking(center.id)} variant="secondary" />
          </View>
        ))}
        {centersWithDistance.length === 0 && <Muted>Nessun centro Campania nel raggio impostato.</Muted>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
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
  listItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
});
