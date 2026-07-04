import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function ReservationChart({ trendData, chartType, isDark, peakTime }) {
  const option = useMemo(() => {
    const labels = trendData.map(d => d.label);
    const values = trendData.map(d => d.count);
    
    const baseOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '10%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: isDark ? '#f9fafb' : '#1f2937',
          fontSize: 13
        },
        formatter: (params) => {
          const data = params[0];
          return `<div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
                  <div style="color: #6b7280; font-size: 12px;">${data.value === 0 ? '无人预约' : `${data.value} 人预约`}</div>`;
        },
        axisPointer: {
          type: chartType === 'line' ? 'cross' : 'shadow',
          lineStyle: {
            color: '#3b82f6',
            width: 1,
            type: 'dashed'
          }
        }
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: chartType === 'bar',
        axisLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6',
            type: 'dashed'
          }
        }
      }
    };

    if (chartType === 'line') {
      return {
        ...baseOption,
        series: [{
          name: '预约人数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#2563eb' }
              ]
            }
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#fff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
              ]
            }
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.5)'
            }
          },
          data: values
        }]
      };
    } else {
      return {
        ...baseOption,
        series: [{
          name: '预约人数',
          type: 'bar',
          barWidth: '50%',
          borderRadius: [6, 6, 0, 0],
          itemStyle: {
            color: (params) => {
              const value = params.value;
              const maxVal = Math.max(...values);
              const ratio = maxVal > 0 ? value / maxVal : 0;
              
              if (value === 0) {
                return isDark ? '#4b5563' : '#e5e7eb';
              }
              if (value === peakTime.count && value > 0) {
                return {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#1d4ed8' }
                  ]
                };
              }
              return {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#60a5fa' },
                  { offset: 1, color: ratio >= 0.5 ? '#3b82f6' : '#93c5fd' }
                ]
              };
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.4)'
            }
          },
          data: values.map((val, idx) => ({
            value: val,
            label: val > 0 && val === peakTime.count ? {
              show: true,
              position: 'top',
              color: '#f97316',
              fontSize: 11,
              fontWeight: 'bold',
              formatter: '高峰'
            } : undefined
          }))
        }]
      };
    }
  }, [trendData, chartType, isDark, peakTime]);

  return (
    <ReactECharts
      option={option}
      style={{ height: '250px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
