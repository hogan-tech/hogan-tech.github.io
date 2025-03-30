let chart;
const USE_MOCK = false; // 切换为 false 后可接真实 API
let conversationHistory = [];

// const FIXED_DATE = '2025-03-29';
// if (!localStorage.getItem("loggedInUser")) {
//     window.location.href = "login.html";
// }
const checkUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!checkUser || !checkUser.userName) {
    window.location.href = "login.html";
}

const MOCK_INPUT_DATA = [
    { _id: "2025-03-20T13:00:00Z", count: 1 },
    { _id: "2025-03-25T13:00:00Z", count: 10 },
    { _id: "2025-03-25T18:00:00Z", count: 10 },
    { _id: "2025-03-27T18:00:00Z", count: 10 },
    { _id: "2025-03-26T14:00:00Z", count: 1 },
    { _id: "2025-03-26T14:01:00Z", count: 3 },
    { _id: "2025-03-27T14:00:00Z", count: 1 },
    { _id: "2025-03-28T10:00:00Z", count: 2 },
    { _id: "2025-03-30T08:00:00Z", count: 3 },
    { _id: "2025-03-30T09:00:00Z", count: 3 },
    { _id: "2025-03-30T09:10:00Z", count: 3 },
    { _id: "2025-03-30T09:10:01Z", count: 3 },
];

function setActiveTab(activeTabId) {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
        tab.classList.toggle("active", tab.id === activeTabId);
    });
}

function getWeekdayName(dateStr) {
    const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    return weekdays[new Date(dateStr).getUTCDay()];
}

function aggregateByWeekday(data) {
    const aggregation = {};
    data.forEach((item) => {
        aggregation[item.weekday] =
            (aggregation[item.weekday] || 0) + item.count;
    });
    return aggregation;
}

function renderEChart(labels, counts, labelTitle) {
    const chartDom = document.getElementById("chart");
    if (chart) chart.dispose();
    chart = echarts.init(chartDom, "customized");
    const option = {
        title: { text: labelTitle, left: "center" },
        tooltip: {},
        xAxis: { type: "category", data: labels },
        yAxis: { type: "value", min: 0 },
        series: [
            {
                data: counts,
                type: "bar",
                itemStyle: { color: "rgba(255, 99, 132, 0.5)" },
            },
        ],
    };
    chart.setOption(option);
}
async function fetchAnxietyData(type) {
    if (USE_MOCK) return MOCK_INPUT_DATA;

    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user || !user.userName) {
        console.error("User not logged in.");
        return [];
    }

    const userName = user.userName;
    const today = new Date().toISOString().split("T")[0];
    let url;

    if (type === "today") {
        url = `https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety/today?userName=${userName}&day=${today}`;
    } else if (type === "sevenDays") {
        url = `https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety/sevenDays?userName=${userName}&day=${today}`;
    } else {
        throw new Error("Unknown data type requested: " + type);
    }

    try {
        const res = await fetch(url);
        const rawData = await res.json();
        console.log(`🔍 fetchAnxietyData [${type}] 返回的数据：`, rawData);

        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        const result = [];

        for (const record of dataArray) {
            const day = record.day || today;
            const times = record.time;

            if (type === "sevenDays") {
                // ✅ 每日总数，用于 weekly 图表
                result.push({
                    _id: `${day}T00:00:00Z`,
                    count: record.count || 0,
                });
            } else if (type === "today") {
                if (Array.isArray(times) && times.length > 0) {
                    for (const t of times) {
                        const timestamp = `${day}T${t.replace(",", "")}:00Z`;
                        result.push({ _id: timestamp, count: 1 });
                    }
                } else if (record.count > 0) {
                    // ✅ fallback：如果有 count 但没有 time，默认添加中午时间点
                    console.warn(
                        `⚠️ today: ${day} 有 count=${record.count} 但 time 是空，使用 fallback 时间`
                    );
                    for (let i = 0; i < record.count; i++) {
                        const timestamp = `${day}T12:00:00Z`;
                        result.push({ _id: timestamp, count: 1 });
                    }
                }
            }
        }

        return result;
    } catch (err) {
        console.error("❌ Failed to fetch anxiety data:", err);
        return [];
    }
}

async function loadWeeklyChart() {
    setActiveTab("tab-weekly");
    const inputData = await fetchAnxietyData("sevenDays");
    const today = new Date();
    const startDate = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate() - 6
        )
    );
    const dates = [];
    const dateCounts = {};

    for (
        let d = new Date(startDate);
        d <= today;
        d.setUTCDate(d.getUTCDate() + 1)
    ) {
        const dateStr = d.toISOString().split("T")[0];
        dates.push(dateStr);
        dateCounts[dateStr] = 0;
    }

    inputData.forEach((item) => {
        const dateStr = item._id.split("T")[0];
        if (dateStr >= dates[0] && dateStr <= dates[dates.length - 1]) {
            dateCounts[dateStr] += item.count;
        }
    });

    const counts = dates.map((date) => dateCounts[date]);
    renderEChart(dates, counts, "Weekly Anxiety Count (Past 7 Days)");
}

async function loadDailyChart() {
    setActiveTab("tab-daily");

    const inputData = await fetchAnxietyData("today");
    const today = new Date().toISOString().split("T")[0];

    // 过滤出今天的数据并提取小时
    const dailyData = inputData
        .filter((item) => item._id.split("T")[0] === today)
        .map((item) => {
            const hour = new Date(item._id).getUTCHours();
            return { hour: `${hour}:00`, count: item.count };
        });

    // 初始化每小时统计
    const allHours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyCounts = {};
    allHours.forEach((hour) => (hourlyCounts[hour] = 0));

    dailyData.forEach((item) => {
        hourlyCounts[item.hour] = (hourlyCounts[item.hour] || 0) + item.count;
    });

    const counts = allHours.map((hour) => hourlyCounts[hour]);
    renderEChart(allHours, counts, "Today Hourly Anxiety Count");
}

document
    .getElementById("tab-weekly")
    .addEventListener("click", loadWeeklyChart);
document.getElementById("tab-daily").addEventListener("click", loadDailyChart);

loadWeeklyChart();
callGemini();

async function callGemini() {
    console.log("Calling Gemini API...");
    const GEMINI_API_KEY = "AIzaSyBaOQMQbeP-ACNwGlZ_XxTrbkhn1AZ2300";
    const MODEL_ID = "gemini-2.0-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:streamGenerateContent?key=${GEMINI_API_KEY}`;

    // 根据 USE_MOCK 选择数据源
    const data = USE_MOCK
        ? MOCK_INPUT_DATA
        : await fetchAnxietyData("sevenDays");

    const contents = [
        {
            role: "user",
            parts: [
                {
                    text: `You are an agent that can analyze the following data: ${JSON.stringify(
                        data,
                        null,
                        2
                    )}. These data represent moments when the user felt nervous. The higher the count, the more nervous the user felt. Please provide a friendly, supportive analysis and advice on how to relieve stress.`,
                },
            ],
        },
        {
            role: "user",
            parts: [
                {
                    text: "Keep your answers under 3 paragraphs. You can give a short analysis, but focus more on helping the user relieve stress as a friend.",
                },
            ],
        },
        {
            role: "user",
            parts: [
                {
                    text: "The data only includes today and the week before, with time periods for each day. You may analyze whether the user tends to feel nervous on weekdays or weekends based on the date, but do not mention the calculation process. If anxiety is decreasing, encourage. If increasing, give advice. If today has no anxiety, praise that.",
                },
            ],
        },
    ];

    const payload = {
        contents,
        generationConfig: {
            responseMimeType: "text/plain",
        },
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        let fullText = "";
        result.forEach((part) => {
            const text = part?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) fullText += text;
        });

        document.getElementById("geminiOutput").innerHTML = fullText
            ? `<b>Gemini:</b><br>${fullText.replace(/\n/g, "<br>")}`
            : "No useful content returned.";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        document.getElementById("geminiOutput").textContent =
            "Error: " + error.message;
    }
}

async function sendUserMessage() {
    const userText = document.getElementById("userInput").value.trim();
    if (!userText) return;

    document.getElementById(
        "geminiOutput"
    ).innerHTML = `<b>You:</b> ${userText}<br><i>Gemini is thinking...</i>`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { responseMimeType: "text/plain" },
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=AIzaSyBaOQMQbeP-ACNwGlZ_XxTrbkhn1AZ2300`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        const result = await response.json();
        let reply = "";
        result.forEach((part) => {
            const text = part?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) reply += text;
        });
        document.getElementById(
            "geminiOutput"
        ).innerHTML = `<b>You:</b> ${userText}<br><b>Gemini:</b> ${reply.replace(
            /\n/g,
            "<br>"
        )}`;
        document.getElementById("userInput").value = "";
    } catch (error) {
        document.getElementById("geminiOutput").textContent = "Error: " + error;
    }
}
