let chart;
const USE_MOCK = true; // 切换为 false 后可接真实 API

const MOCK_INPUT_DATA = [
    { _id: '2025-03-20T13:00:00Z', count: 1 },
    { _id: '2025-03-25T13:00:00Z', count: 10 },
    { _id: '2025-03-25T18:00:00Z', count: 10 },
    { _id: '2025-03-26T14:00:00Z', count: 1 },
    { _id: '2025-03-27T14:00:00Z', count: 1 },
    { _id: '2025-03-28T10:00:00Z', count: 2 },
    { _id: '2025-03-29T08:00:00Z', count: 3 }
];

// 辅助函数：设置 active tab 样式
function setActiveTab(activeTabId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.id === activeTabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// 将时间戳转换为星期几的英文名称（使用 UTC 以保持数据不受本地时区影响）
function getWeekdayName(dateStr) {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[new Date(dateStr).getUTCDay()];
}

// 聚合数据：对转换后的数据按星期累加 count
function aggregateByWeekday(data) {
    const aggregation = {};
    data.forEach(item => {
        aggregation[item.weekday] = (aggregation[item.weekday] || 0) + item.count;
    });
    return aggregation;
}

// 使用 ECharts 绘制图表，并应用 "customized" 主题
function renderEChart(labels, counts, labelTitle) {
    const chartDom = document.getElementById('chart');
    // 如果已存在图表实例，则 dispose 旧实例
    if (chart) {
        chart.dispose();
    }
    chart = echarts.init(chartDom, 'customized');
    const option = {
        title: {
            text: labelTitle,
            left: 'center'
        },
        tooltip: {},
        xAxis: {
            type: 'category',
            data: labels
        },
        yAxis: {
            type: 'value',
            min: 0
        },
        series: [{
            data: counts,
            type: 'bar',
            itemStyle: {
                // 可根据主题调整颜色
                color: 'rgba(255, 99, 132, 0.5)'
            }
        }]
    };
    chart.setOption(option);
}

// 加载每週图表数据并渲染：统计从最近7天（含今天）的每日总次数
async function loadWeeklyChart() {
    setActiveTab('tab-weekly');

    let inputData;
    if (USE_MOCK) {
        inputData = MOCK_INPUT_DATA;
    } else {
        const response = await fetch('https://your-teammate-api.com/api/stats/daily');
        inputData = await response.json();
    }
    
    // 对每条记录，转换 _id 为星期几名称
    const converted = inputData.map(item => ({
        weekday: getWeekdayName(item._id),
        count: item.count
    }));
    
    // 聚合数据
    const aggregated = aggregateByWeekday(converted);
    // 固定顺序：Sunday ~ Saturday
    const orderedWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const labels = orderedWeekdays;
    const counts = orderedWeekdays.map(day => aggregated[day] || 0);
    
    renderEChart(labels, counts, 'Weekly Anxiety Count');
}

// 加载今日图表数据并渲染（按小时统计）
// 这里我们使用全局 MOCK_INPUT_DATA，并过滤出日期等于 today 的记录
async function loadDailyChart() {
    setActiveTab('tab-daily');

    let dailyData;
    // 获取当前日期字符串（UTC日期），格式 "YYYY-MM-DD"
    const today = new Date().toISOString().split('T')[0];

    if (USE_MOCK) {
        dailyData = MOCK_INPUT_DATA
            .filter(item => item._id.split('T')[0] === today)
            .map(item => ({
                // 使用 getUTCHours() 保持数据一致
                hour: new Date(item._id).getUTCHours() + ':00',
                count: item.count
            }));
    } else {
        const response = await fetch('https://your-teammate-api.com/api/stats/hourly');
        const raw = await response.json();
        dailyData = raw
            .filter(item => item._id.split('T')[0] === today)
            .map(item => ({
                hour: new Date(item._id).getUTCHours() + ':00',
                count: item.count
            }));
    }
    
    // 生成完整的 24 小时标签数组
    const allHours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    // 构造一个字典，把过滤出的 dailyData 按小时存储（累加相同小时数据）
    const hourlyCounts = {};
    dailyData.forEach(item => {
        hourlyCounts[item.hour] = (hourlyCounts[item.hour] || 0) + item.count;
    });
    
    // 为所有 24 小时生成 count 数组，若无数据则为 0
    const counts = allHours.map(hour => hourlyCounts[hour] || 0);
    
    renderEChart(allHours, counts, 'Today Hourly Anxiety Count');
}

// 绑定 tab 按钮切换事件（确保 HTML 中有相应的 id）
document.getElementById('tab-weekly').addEventListener('click', loadWeeklyChart);
document.getElementById('tab-daily').addEventListener('click', loadDailyChart);

// 默认加载每週图表
loadWeeklyChart();