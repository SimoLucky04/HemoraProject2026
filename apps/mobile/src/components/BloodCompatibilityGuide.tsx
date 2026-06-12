import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Card } from '@components/Card';
import { Muted } from '@components/TextBlocks';
import { useHemora } from '@context/HemoraContext';
import { colors, radius, spacing } from '@theme';
import {
  ALL_BLOOD_TYPES,
  formatBloodType,
  getCompatibleDonors,
  getCompatibleRecipients,
  isUniversalDonor,
  isUniversalRecipient,
  type FullBloodType,
} from '@utils/bloodCompatibility';

// Geometria del diagramma: due colonne di gocce (DONATORI a sinistra, RICEVENTI a
// destra) con le frecce di compatibilita tracciate in mezzo via SVG.
const DROPLET = 44;
const ROW_GAP = 12;
const ARROW = 9; // lunghezza punta freccia
const N = ALL_BLOOD_TYPES.length;
const DIAGRAM_H = N * DROPLET + (N - 1) * ROW_GAP;

type Mode = 'donate' | 'receive';
type DropletState = 'focus' | 'match' | 'dim';

function rowCenterY(index: number): number {
  return index * (DROPLET + ROW_GAP) + DROPLET / 2;
}

// Punta di freccia (triangolo) con vertice in (x,y), orientata lungo `angle`.
function arrowHead(x: number, y: number, angle: number): string {
  const a1 = angle + Math.PI - Math.PI / 7;
  const a2 = angle + Math.PI + Math.PI / 7;
  const p1 = `${x + ARROW * Math.cos(a1)},${y + ARROW * Math.sin(a1)}`;
  const p2 = `${x + ARROW * Math.cos(a2)},${y + ARROW * Math.sin(a2)}`;
  return `${x},${y} ${p1} ${p2}`;
}

// Guida interattiva alla compatibilita del sangue intero: scegli un gruppo
// (toccando una goccia o cambiando direzione) e vedi le frecce verso/dai gruppi
// compatibili. Tutto derivato dai dati in @utils/bloodCompatibility, niente immagini.
export function BloodCompatibilityGuide() {
  const { profile } = useHemora().state;

  // Selezione iniziale dal profilo (gruppo + Rh impostati), altrimenti 0+ neutro.
  const [selected, setSelected] = useState<FullBloodType>(() =>
    profile.bloodGroup && profile.rh ? formatBloodType(profile.bloodGroup, profile.rh) : '0+'
  );
  const [mode, setMode] = useState<Mode>('donate');
  const [width, setWidth] = useState(0);

  const selIndex = ALL_BLOOD_TYPES.indexOf(selected);
  const matches = mode === 'donate' ? getCompatibleRecipients(selected) : getCompatibleDonors(selected);
  const matchSet = new Set<FullBloodType>(matches);

  // Frecce sempre donatore (sinistra) -> ricevente (destra). Cambia solo quale
  // estremo e il gruppo "focus": in "donate" e il donatore, in "receive" il ricevente.
  const arrows =
    mode === 'donate'
      ? matches.map((recipient) => ({ from: selIndex, to: ALL_BLOOD_TYPES.indexOf(recipient) }))
      : matches.map((donor) => ({ from: ALL_BLOOD_TYPES.indexOf(donor), to: selIndex }));

  const startX = DROPLET - 2; // bordo destro della colonna sinistra
  const endX = width - DROPLET + 2; // bordo sinistro della colonna destra

  const universal =
    (mode === 'donate' && isUniversalDonor(selected)) ||
    (mode === 'receive' && isUniversalRecipient(selected));
  const note = universal
    ? mode === 'donate'
      ? `${selected}: donatore universale di sangue intero.`
      : `${selected}: ricevente universale di sangue intero.`
    : `${matches.length} gruppi compatibili su ${N}.`;

  function leftState(type: FullBloodType): DropletState {
    if (mode === 'donate') return type === selected ? 'focus' : 'dim';
    return matchSet.has(type) ? 'match' : 'dim';
  }
  function rightState(type: FullBloodType): DropletState {
    if (mode === 'receive') return type === selected ? 'focus' : 'dim';
    return matchSet.has(type) ? 'match' : 'dim';
  }

  return (
    <Card>
      <Muted>Tocca una goccia per vedere le frecce di compatibilità (sangue intero).</Muted>

      <View style={styles.modeRow}>
        <ModePill label="Posso donare a" active={mode === 'donate'} onPress={() => setMode('donate')} />
        <ModePill label="Posso ricevere da" active={mode === 'receive'} onPress={() => setMode('receive')} />
      </View>

      <View style={styles.colHeaders}>
        <Text style={[styles.colHeader, styles.colHeaderDonor]}>DONATORI</Text>
        <Text style={[styles.colHeader, styles.colHeaderRecipient]}>RICEVENTI</Text>
      </View>

      <View style={styles.diagram} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
        {width > 0 ? (
          <Svg width={width} height={DIAGRAM_H} style={StyleSheet.absoluteFill}>
            {arrows.map((arrow) => {
              const y1 = rowCenterY(arrow.from);
              const y2 = rowCenterY(arrow.to);
              const angle = Math.atan2(y2 - y1, endX - startX);
              return (
                <React.Fragment key={`${arrow.from}-${arrow.to}`}>
                  <Line x1={startX} y1={y1} x2={endX} y2={y2} stroke={colors.primary} strokeWidth={2} opacity={0.85} />
                  <Polygon points={arrowHead(endX, y2, angle)} fill={colors.primary} />
                </React.Fragment>
              );
            })}
          </Svg>
        ) : null}

        {ALL_BLOOD_TYPES.map((type, i) => (
          <React.Fragment key={type}>
            <Pressable
              onPress={() => {
                setSelected(type);
                setMode('donate');
              }}
              accessibilityRole="button"
              accessibilityLabel={`${type}, donatore`}
              accessibilityState={{ selected: mode === 'donate' && type === selected }}
              style={[styles.dropletWrap, { left: 0, top: rowCenterY(i) - DROPLET / 2 }]}
            >
              <Droplet type={type} state={leftState(type)} crown={mode === 'donate' && type === selected && universal} />
            </Pressable>

            <Pressable
              onPress={() => {
                setSelected(type);
                setMode('receive');
              }}
              accessibilityRole="button"
              accessibilityLabel={`${type}, ricevente`}
              accessibilityState={{ selected: mode === 'receive' && type === selected }}
              style={[styles.dropletWrap, { left: width - DROPLET, top: rowCenterY(i) - DROPLET / 2 }]}
            >
              <Droplet type={type} state={rightState(type)} crown={mode === 'receive' && type === selected && universal} />
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.note} accessible accessibilityLabel={note}>
        <Ionicons name="information-circle" size={15} color={colors.primary} />
        <Text style={styles.noteText}>{note}</Text>
      </View>

      <Text style={styles.rhRule}>Rh− dona a Rh− e Rh+; Rh+ dona solo a Rh+.</Text>
    </Card>
  );
}

function ModePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.modePill, active && styles.modePillActive, pressed && styles.pressed]}
    >
      <Text style={[styles.modePillText, active && styles.modePillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const DROPLET_STYLES: Record<DropletState, { bg: string; border: string; text: string }> = {
  focus: { bg: colors.primary, border: colors.primary, text: colors.surface },
  match: { bg: colors.primarySoft, border: colors.primary, text: colors.primaryDark },
  dim: { bg: colors.surfaceMuted, border: colors.border, text: colors.muted },
};

function Droplet({ type, state, crown }: { type: FullBloodType; state: DropletState; crown: boolean }) {
  const visual = DROPLET_STYLES[state];
  return (
    <View style={styles.dropletInner}>
      {crown ? (
        <MaterialCommunityIcons name="crown" size={16} color={colors.plasma} style={styles.crown} />
      ) : null}
      <View style={[styles.droplet, { backgroundColor: visual.bg, borderColor: visual.border }]}>
        <Text style={[styles.dropletText, { color: visual.text }]}>{type}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modePill: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  modePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  modePillText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  modePillTextActive: {
    color: colors.surface,
  },
  colHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  colHeaderDonor: {
    color: colors.primaryDark,
  },
  colHeaderRecipient: {
    color: colors.muted,
  },
  diagram: {
    height: DIAGRAM_H,
    position: 'relative',
  },
  dropletWrap: {
    position: 'absolute',
    width: DROPLET,
    height: DROPLET,
  },
  dropletInner: {
    width: DROPLET,
    height: DROPLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  droplet: {
    width: DROPLET,
    height: DROPLET,
    borderRadius: DROPLET / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropletText: {
    fontSize: 13,
    fontWeight: '900',
  },
  crown: {
    position: 'absolute',
    top: -12,
    zIndex: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  noteText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  rhRule: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
