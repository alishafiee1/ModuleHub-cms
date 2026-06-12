/**
 * build-home-icon-themes.js — extracts Lucide SVG paths into public/assets/home-icon-themes.json
 * Run: npm run build:icons
 */
const fs = require('fs');
const path = require('path');
const lucide = require('lucide');

const THEME_ICON_NAMES = {
  nature: [
    'Leaf', 'TreePine', 'Flower2', 'Droplets', 'Sun', 'Cloud', 'Mountain', 'Waves',
    'Sprout', 'Bird', 'Fish', 'Bug', 'Rainbow', 'Wind', 'Moon', 'Star', 'CloudRain', 'Snowflake',
  ],
  technology: [
    'Cpu', 'Server', 'Wifi', 'CircuitBoard', 'Bot', 'Radio', 'Monitor', 'Smartphone',
    'HardDrive', 'Database', 'CloudCog', 'Globe', 'Satellite', 'Microchip', 'Plug', 'Cable',
    'Router', 'Binary',
  ],
  tools: [
    'Wrench', 'Hammer', 'PocketKnife', 'Ruler', 'Settings2', 'PenTool', 'Scissors', 'Paintbrush',
    'Drill', 'Axe', 'Pickaxe', 'Toolbox', 'Nut', 'Bolt', 'Compass', 'Pencil', 'Eraser', 'Brush',
  ],
  vehicles: [
    'Car', 'Truck', 'Plane', 'Ship', 'Bike', 'TrainFront', 'Bus', 'Rocket',
    'Sailboat', 'Ambulance', 'Tractor', 'Forklift', 'CableCar', 'Fuel', 'LocateFixed', 'MapPin',
    'TrafficCone', 'LifeBuoy',
  ],
};

/**
 * Extracts SVG path `d` attributes from a Lucide icon node array.
 * @param {Array} iconNode - Lucide icon definition
 * @returns {string[]}
 */
function extractPathsFromIconNode(iconNode) {
  if (!Array.isArray(iconNode)) {
    return [];
  }
  const paths = [];
  for (const element of iconNode) {
    if (!Array.isArray(element) || element.length < 2) {
      continue;
    }
    const [tagName, attributes] = element;
    if (tagName === 'path' && attributes?.d) {
      paths.push(attributes.d);
    }
    if (tagName === 'circle' && attributes) {
      const cx = Number(attributes.cx ?? 12);
      const cy = Number(attributes.cy ?? 12);
      const radius = Number(attributes.r ?? 0);
      if (radius > 0) {
        paths.push(
          `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`,
        );
      }
    }
    if (tagName === 'rect' && attributes) {
      const x = Number(attributes.x ?? 0);
      const y = Number(attributes.y ?? 0);
      const width = Number(attributes.width ?? 0);
      const height = Number(attributes.height ?? 0);
      const rx = Number(attributes.rx ?? 0);
      if (width > 0 && height > 0) {
        if (rx > 0) {
          paths.push(
            `M ${x + rx} ${y} h ${width - rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${rx} v ${height - rx * 2} a ${rx} ${rx} 0 0 1 ${-rx} ${rx} h ${-(width - rx * 2)} a ${rx} ${rx} 0 0 1 ${-rx} ${-rx} v ${-(height - rx * 2)} a ${rx} ${rx} 0 0 1 ${rx} ${-rx} z`,
          );
        } else {
          paths.push(`M ${x} ${y} h ${width} v ${height} h ${-width} z`);
        }
      }
    }
  }
  return paths;
}

/**
 * Resolves Lucide icon export by PascalCase name.
 * @param {string} iconName - Lucide export name
 * @returns {{ name: string, paths: string[] }|null}
 */
function resolveIcon(iconName) {
  const iconNode = lucide[iconName];
  if (!iconNode) {
    console.warn(`[build:icons] Missing Lucide icon: ${iconName}`);
    return null;
  }
  const paths = extractPathsFromIconNode(iconNode);
  if (paths.length === 0) {
    console.warn(`[build:icons] No paths for icon: ${iconName}`);
    return null;
  }
  return { name: iconName, paths };
}

function buildThemesPayload() {
  const output = {};
  for (const [theme, iconNames] of Object.entries(THEME_ICON_NAMES)) {
    output[theme] = iconNames
      .map((iconName) => resolveIcon(iconName))
      .filter(Boolean);
  }
  return output;
}

function main() {
  const outputPath = path.join(__dirname, '..', 'public', 'assets', 'home-icon-themes.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const payload = buildThemesPayload();
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const counts = Object.entries(payload).map(([theme, icons]) => `${theme}:${icons.length}`).join(', ');
  console.log(`[build:icons] Wrote ${outputPath} (${counts})`);
}

main();
