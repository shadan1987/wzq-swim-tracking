(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var good = style.getPropertyValue('--good').trim();
  var warn = style.getPropertyValue('--warn').trim();
  var bad = style.getPropertyValue('--bad').trim();

  // --- Chart 1: Radar Chart ---
  var radarEl = document.getElementById('chart-radar');
  if (radarEl) {
    var radar = echarts.init(radarEl, null, { renderer: 'svg' });
    radar.setOption({
      animation: false,
      tooltip: { trigger: 'item', appendToBody: true },
      legend: {
        data: ['距三级标准达成率 (%)'],
        bottom: 10,
        textStyle: { color: muted, fontSize: 12 }
      },
      radar: {
        indicator: [
          { name: '50自', max: 100 },
          { name: '100自', max: 100 },
          { name: '50蝶', max: 100 },
          { name: '100蝶', max: 100 },
          { name: '50仰', max: 100 },
          { name: '100仰', max: 100 },
          { name: '50蛙', max: 100 },
          { name: '100蛙', max: 100 },
          { name: '200混', max: 100 }
        ],
        center: ['50%', '52%'],
        radius: '65%',
        splitNumber: 4,
        axisName: { color: ink, fontSize: 12, fontWeight: 700 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: [bg2, '#e8f1fc'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: [
            Math.round((31.00 / 34.20) * 100),  // 50自: 90.6%
            Math.round((68.00 / 74.28) * 100),  // 100自: 91.5%
            Math.round((32.00 / 36.82) * 100),  // 50蝶: 86.9%
            Math.round((71.00 / 81.57) * 100),  // 100蝶: 87.0%
            Math.round((36.00 / 42.73) * 100),  // 50仰: 84.2%
            Math.round((80.00 / 86.83) * 100),  // 100仰: 92.1%
            Math.round((41.00 / 48.63) * 100),  // 50蛙: 84.3%
            Math.round((83.00 / 108.35) * 100), // 100蛙: 76.6%
            Math.round((167.00 / 187.51) * 100) // 200混: 89.1%
          ],
          name: '距三级标准达成率 (%)',
          areaStyle: { color: accent2 + '40' },
          lineStyle: { color: accent, width: 2 },
          itemStyle: { color: accent }
        }]
      }]
    });
    window.addEventListener('resize', function() { radar.resize(); });
  }

  // --- Chart 2: Trend Line Chart ---
  var trendEl = document.getElementById('chart-trend');
  if (trendEl) {
    var trend = echarts.init(trendEl, null, { renderer: 'svg' });
    trend.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true },
      legend: {
        data: ['50米蝶泳', '50米自由泳', '100米蝶泳(秒)'],
        bottom: 5,
        textStyle: { color: muted, fontSize: 12 }
      },
      grid: { top: 30, left: 55, right: 30, bottom: 50 },
      xAxis: {
        type: 'category',
        data: ['7/8', '7/18', '7/20', '7/23', '7/27', '7/31', '8/1', '8/2', '8/4', '8/6', '8/8', '8/9', '8/10', '8/11'],
        axisLabel: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: '成绩(秒)',
        nameTextStyle: { color: muted, fontSize: 12 },
        min: 30,
        max: 95,
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: '50米蝶泳',
          type: 'line',
          data: [39.00, 37.98, null, null, 37.35, null, null, 37.01, null, 38.58, 38.73, 37.90, null, 36.82],
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: accent, width: 3 },
          itemStyle: { color: accent },
          connectNulls: true
        },
        {
          name: '50米自由泳',
          type: 'line',
          data: [null, null, 34.57, null, null, 34.24, null, null, null, 34.85, 34.20, null, 35.19, null],
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: accent2, width: 3 },
          itemStyle: { color: accent2 },
          connectNulls: true
        },
        {
          name: '100米蝶泳(秒)',
          type: 'line',
          data: [null, null, null, 87.15, 83.44, null, 81.57, null, null, null, 84.17, null, null, null],
          smooth: true,
          symbol: 'diamond',
          symbolSize: 8,
          lineStyle: { color: warn, width: 3, type: 'dashed' },
          itemStyle: { color: warn },
          connectNulls: true
        }
      ]
    });
    window.addEventListener('resize', function() { trend.resize(); });
  }
})();
