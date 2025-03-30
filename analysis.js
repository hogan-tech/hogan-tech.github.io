let chart;
const USE_MOCK = true; // 切换为 false 后可接真实 API
let conversationHistory = [];

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

async function loadWeeklyChart() {
    setActiveTab("tab-weekly");
    const inputData = USE_MOCK ? MOCK_INPUT_DATA : await fetchData("daily");
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
    const today = new Date().toISOString().split("T")[0];
    const dailyData = (USE_MOCK ? MOCK_INPUT_DATA : await fetchData("hourly"))
        .filter((item) => item._id.split("T")[0] === today)
        .map((item) => ({
            hour: new Date(item._id).getUTCHours() + ":00",
            count: item.count,
        }));

    const allHours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyCounts = {};
    dailyData.forEach((item) => {
        hourlyCounts[item.hour] = (hourlyCounts[item.hour] || 0) + item.count;
    });
    const counts = allHours.map((hour) => hourlyCounts[hour] || 0);
    renderEChart(allHours, counts, "Today Hourly Anxiety Count");
}

async function fetchData(type) {
    const endpoint = `https://your-teammate-api.com/api/stats/${type}`;
    const response = await fetch(endpoint);
    return await response.json();
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

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                            "You are an agent that can analyze the following data: " +
                            JSON.stringify(MOCK_INPUT_DATA, null, 2) +
                            ". Based on these data, please provide a short, friendly analysis and advice on how to relieve stress, keeping your answer under 3 paragraphs.",
                    },
                ],
            },
        ],
        generationConfig: { responseMimeType: "text/plain" },
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
            ? fullText.replace(/\n/g, "<br>")
            : "No useful content returned.";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        document.getElementById("geminiOutput").textContent = "Error: " + error;
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
