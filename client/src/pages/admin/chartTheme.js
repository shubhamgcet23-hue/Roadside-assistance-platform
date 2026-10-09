// Categorical chart colours, assigned in fixed order (validated default palette, light surface).
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
export const AXIS_TICK = { fontSize: 12, fill: '#485766' };
export const GRID = '#e8ecf0';
export const LEGEND_STYLE = { color: '#36424e', fontSize: 13 };
export const shortDay = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
