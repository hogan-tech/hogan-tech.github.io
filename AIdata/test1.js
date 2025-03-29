// 全局模拟数据（MOCK_INPUT_DATA）: 数据格式为 { _id: 时间戳字符串, count: 数量 }
const MOCK_INPUT_DATA = [
    { _id: '2025-03-20T13:00:00Z', count: 1 },
    { _id: '2025-03-25T13:00:00Z', count: 10 },
    { _id: '2025-03-25T18:00:00Z', count: 10 },
    { _id: '2025-03-26T14:00:00Z', count: 1 },
    { _id: '2025-03-27T14:00:00Z', count: 1 },
    { _id: '2025-03-28T10:00:00Z', count: 2 },
    { _id: '2025-03-29T08:00:00Z', count: 3 }
  ];
  
  // 将 _id 转换为星期几英文名称，使用 getUTCDay() 保证不受本地时区影响
  function getWeekdayName(dateStr) {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[new Date(dateStr).getUTCDay()];
  }
  
  // 聚合数据：对每条记录按星期累加 count
  function aggregateByWeekday(data) {
    const aggregation = {};
    data.forEach(item => {
      const day = getWeekdayName(item._id);
      aggregation[day] = (aggregation[day] || 0) + item.count;
    });
    return aggregation;
  }
  
  // 绘制 D3.js 柱状图函数
  function drawWeeklyChart(data) {
    // 聚合数据
    const aggregated = aggregateByWeekday(data);
    // 定义固定的星期顺序：Sunday 到 Saturday
    const orderedWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // 生成图表数据数组
    const chartData = orderedWeekdays.map(day => ({
      weekday: day,
      count: aggregated[day] || 0
    }));
    
    // 设置图表尺寸
    const margin = {top: 20, right: 20, bottom: 40, left: 50},
          width = 500 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;
    
    // 清空可能存在的旧图表
    d3.select("#chart").select("svg").remove();
    
    // 创建 SVG 容器
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // x 轴刻度：ordinal scale
    const x = d3.scaleBand()
      .domain(orderedWeekdays)
      .range([0, width])
      .padding(0.1);
    
    // y 轴刻度：linear scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count)])
      .nice()
      .range([height, 0]);
    
    // 绘制柱状图
    svg.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.weekday))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count));
    
    // 添加 x 轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("class", "axis-label")
        .style("text-anchor", "middle");
    
    // 添加 y 轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
        .attr("class", "axis-label");
    
    // 添加 x 轴标签
    svg.append("text")
        .attr("transform", `translate(${width/2}, ${height + margin.bottom - 5})`)
        .style("text-anchor", "middle")
        .text("Weekday");
    
    // 添加 y 轴标签
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Count");
  }
  
  // 调用绘制函数，使用全局的 MOCK_INPUT_DATA
  drawWeeklyChart(MOCK_INPUT_DATA);