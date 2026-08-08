import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme, fonts } from '../theme/useTheme';

const NODES = [
  { id: 'root', label: 'Get Fit', x: 50, y: 14, bg: 'accentSolid', ink: '#fff' },
  { id: 'walk', label: 'Morning walk', x: 16, y: 42, bg: 'amberTint', ink: 'amber' },
  { id: 'water', label: 'Drink water', x: 82, y: 42, bg: 'tealTint', ink: 'teal' },
  { id: 'sleep', label: 'Sleep 8h', x: 46, y: 64, bg: 'accentTint', ink: 'accent' },
  { id: 'screens', label: 'No late screens', x: 30, y: 88, bg: 'coralTint', ink: 'coral' },
] as const;

const EDGES: [string, string][] = [
  ['root', 'walk'],
  ['root', 'water'],
  ['root', 'sleep'],
  ['sleep', 'screens'],
];

export default function MindMapScreen() {
  const { colors } = useTheme();
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  function resolve(key: string) {
    if (key === 'accentSolid') return colors.accent;
    return (colors as Record<string, string>)[key];
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Mind maps</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Break a goal into supporting habits. Editing your own maps is coming soon.
        </Text>
      </View>
      <View style={[styles.canvas, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          {EDGES.map(([a, b]) => (
            <Line
              key={`${a}-${b}`}
              x1={byId[a].x}
              y1={byId[a].y}
              x2={byId[b].x}
              y2={byId[b].y}
              stroke={colors.border}
              strokeWidth={0.4}
            />
          ))}
        </Svg>
        {NODES.map((n) => (
          <View
            key={n.id}
            style={[
              styles.node,
              {
                left: `${n.x}%`,
                top: `${n.y}%`,
                backgroundColor: resolve(n.bg),
              },
            ]}
          >
            <Text style={{ color: resolve(n.ink), fontFamily: fonts.bodyBold, fontSize: 12 }}>{n.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 19 },
  canvas: { flex: 1, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  node: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
});
