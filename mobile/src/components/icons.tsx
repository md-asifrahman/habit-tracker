import Svg, { Path, Circle, SvgProps } from 'react-native-svg';

type IconProps = { color?: string; size?: number };

const base = (props: SvgProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export function TodayIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M4 11l8-7 8 7" />
      <Path d="M6 10v9h12v-9" />
    </Svg>
  );
}

export function HabitsIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M5 6h14M5 12h14M5 18h9" />
    </Svg>
  );
}

export function MindMapIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Circle cx="6" cy="7" r="2.4" />
      <Circle cx="18" cy="7" r="2.4" />
      <Circle cx="12" cy="18" r="2.4" />
      <Path d="M8 8l3 8M16 8l-3 8" />
    </Svg>
  );
}

export function StatsIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M5 19V10M12 19V5M19 19v-7" />
    </Svg>
  );
}

export function SettingsIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </Svg>
  );
}

export function CheckIcon({ color = '#000', size = 16 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color, strokeWidth: 2.4 })}>
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  );
}

export function BackIcon({ color = '#000', size = 16 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function PlusIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function WalkIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M4 20c2-2 3-4 3-6M9 20c2-2.5 3-5 3-8M14 20c2-3 3-6.5 3-10" />
    </Svg>
  );
}

export function DropletIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M12 3c3.5 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-7 6-11z" />
    </Svg>
  );
}

export function BookIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z" />
      <Path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13z" />
    </Svg>
  );
}

export function BanIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}

export function LeafIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M12 4c-3 3-6 5.5-6 9.5A6 6 0 0 0 18 13c0-1-.3-1.8-.8-2.6-.6 1.6-1.7 2.3-1.7 2.3.8-3-1.5-5-3.5-8.7z" />
    </Svg>
  );
}
