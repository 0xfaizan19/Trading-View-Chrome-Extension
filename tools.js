// Tool catalog shared by the options page and the content-script bridge.
// Each id is a name accepted by TradingViewApi.selectLineTool(); labels match
// TradingView's own tooltips. Both were checked against tradingview.com.
// These use `var` so that injecting this file again into an open tab
// (see background.js) doesn't throw a redeclaration error.
// The Watchlist group holds actions rather than drawing tools; page.js runs
// those itself instead of passing them to selectLineTool().
var TVCS_TOOL_GROUPS = [
  { name: 'Watchlist', tools: [
    ['collapse_watchlist_sections', 'Collapse all sections (press again to expand)'],
  ] },
  { name: 'Cursors', tools: [
    ['cursor', 'Cross'], ['dot', 'Dot'], ['arrow_cursor', 'Arrow cursor'], ['eraser', 'Eraser'],
  ] },
  { name: 'Lines', tools: [
    ['trend_line', 'Trendline'], ['ray', 'Ray'], ['info_line', 'Info line'], ['extended', 'Extended line'],
    ['trend_angle', 'Trend angle'], ['horizontal_line', 'Horizontal line'], ['horizontal_ray', 'Horizontal ray'],
    ['vertical_line', 'Vertical line'], ['cross_line', 'Crossline'],
  ] },
  { name: 'Channels', tools: [
    ['parallel_channel', 'Parallel channel'], ['regression_trend', 'Regression trend'],
    ['flat_bottom', 'Flat top/bottom'], ['disjoint_angle', 'Disjoint channel'],
  ] },
  { name: 'Pitchforks', tools: [
    ['pitchfork', 'Pitchfork'], ['schiff_pitchfork', 'Schiff pitchfork'],
    ['schiff_pitchfork_modified', 'Modified Schiff pitchfork'], ['inside_pitchfork', 'Inside pitchfork'],
  ] },
  { name: 'Fibonacci', tools: [
    ['fib_retracement', 'Fib retracement'], ['fib_trend_ext', 'Trend-based fib extension'],
    ['fib_channel', 'Fib channel'], ['fib_timezone', 'Fib time zone'],
    ['fib_speed_resist_fan', 'Fib speed resistance fan'], ['fib_trend_time', 'Trend-based fib time'],
    ['fib_circles', 'Fib circles'], ['fib_spiral', 'Fib spiral'],
    ['fib_speed_resist_arcs', 'Fib speed resistance arcs'], ['fib_wedge', 'Fib wedge'], ['pitchfan', 'Pitchfan'],
  ] },
  { name: 'Gann', tools: [
    ['gannbox', 'Gann box'], ['gannbox_fixed', 'Gann square fixed'],
    ['gannbox_square', 'Gann square'], ['gannbox_fan', 'Gann fan'],
  ] },
  { name: 'Chart patterns', tools: [
    ['xabcd_pattern', 'XABCD pattern'], ['cypher_pattern', 'Cypher pattern'],
    ['head_and_shoulders', 'Head and shoulders'], ['abcd_pattern', 'ABCD pattern'],
    ['triangle_pattern', 'Triangle pattern'], ['3divers_pattern', 'Three drives pattern'],
  ] },
  { name: 'Elliott waves', tools: [
    ['elliott_impulse_wave', 'Elliott impulse wave (1·2·3·4·5)'], ['elliott_correction', 'Elliott correction wave (A·B·C)'],
    ['elliott_triangle_wave', 'Elliott triangle wave (A·B·C·D·E)'], ['elliott_double_combo', 'Elliott double combo wave (W·X·Y)'],
    ['elliott_triple_combo', 'Elliott triple combo wave (W·X·Y·X·Z)'],
  ] },
  { name: 'Cycles', tools: [
    ['cyclic_lines', 'Cyclic lines'], ['time_cycles', 'Time cycles'], ['sine_line', 'Sine line'],
  ] },
  { name: 'Forecasting', tools: [
    ['long_position', 'Long position'], ['short_position', 'Short position'], ['forecast', 'Position forecast'],
    ['bars_pattern', 'Bars pattern'], ['ghost_feed', 'Ghost feed'], ['projection', 'Sector'],
  ] },
  { name: 'Volume-based', tools: [
    ['anchored_vwap', 'Anchored VWAP'], ['fixed_range_volume_profile', 'Fixed range volume profile'],
    ['anchored_volume_profile', 'Anchored volume profile'],
  ] },
  { name: 'Measurers', tools: [
    ['price_range', 'Price range'], ['date_range', 'Date range'],
    ['date_and_price_range', 'Date and price range'], ['measure', 'Measure'], ['zoom', 'Zoom in'],
  ] },
  { name: 'Brushes & arrows', tools: [
    ['brush', 'Brush'], ['highlighter', 'Highlighter'], ['arrow_marker', 'Arrow marker'], ['arrow', 'Arrow'],
    ['arrow_up', 'Arrow mark up'], ['arrow_down', 'Arrow mark down'],
  ] },
  { name: 'Shapes', tools: [
    ['rectangle', 'Rectangle'], ['rotated_rectangle', 'Rotated rectangle'], ['path', 'Path'], ['circle', 'Circle'],
    ['ellipse', 'Ellipse'], ['polyline', 'Polyline'], ['triangle', 'Triangle'], ['arc', 'Arc'],
    ['curve', 'Curve'], ['double_curve', 'Double curve'],
  ] },
  { name: 'Text & notes', tools: [
    ['text', 'Text'], ['note', 'Pin'], ['price_note', 'Price note'], ['table', 'Table'], ['callout', 'Callout'],
    ['comment', 'Comment'], ['price_label', 'Price label'], ['signpost', 'Signpost'], ['flag', 'Flag mark'],
  ] },
];

// TradingView's own shortcuts for drawing tools, shown as hints next to each tool.
var TVCS_BUILTIN_TOOL_KEYS = {
  trend_line: 'Alt+KeyT',
  horizontal_line: 'Alt+KeyH',
  horizontal_ray: 'Alt+KeyJ',
  vertical_line: 'Alt+KeyV',
  cross_line: 'Alt+KeyC',
  fib_retracement: 'Alt+KeyF',
  rectangle: 'Alt+Shift+KeyR',
};

// Combos are "<modifiers>+<KeyboardEvent.code>", modifiers in Ctrl, Alt, Shift, Meta order.
var TVCS_DEFAULTS = {
  enabled: true,
  toggleBack: true,
  bindings: {
    trend_line: 'Alt+Digit1',
    price_range: 'Alt+Digit2',
    horizontal_ray: 'Alt+Digit3',
    collapse_watchlist_sections: 'Alt+KeyW',
  },
};

// Defaults added after 1.0.1. Saved bindings replace the defaults wholesale,
// so background.js gives each of these its default key once on update.
var TVCS_ADDED_DEFAULTS = ['collapse_watchlist_sections'];
