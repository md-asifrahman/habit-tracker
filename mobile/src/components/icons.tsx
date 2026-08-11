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

export function ChallengesIcon({ color = '#000', size = 20 }: IconProps) {
  return (
    <Svg {...base({ width: size, height: size, stroke: color })}>
      <Path d="M5 6h14M5 12h14M5 18h9" />
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
