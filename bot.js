import fetch from "node-fetch";

const apiKey = "YOUR_API_KEY";

const calculateStatus = (ph, turbidity, tds) => {
  const phValue = parseFloat(ph);
  const turbidityValue = parseFloat(turbidity);
  const tdsValue = parseFloat(tds);

  if (phValue < 6 || phValue > 8 || turbidityValue >= 35 || tdsValue > 500) {
    return "danger";
  } else if (
    (phValue >= 6 && phValue <= 6.5) ||
    (phValue >= 8.5 && phValue <= 10) ||
    (turbidityValue > 2 && turbidityValue <= 5) ||
    (tdsValue > 300 && tdsValue <= 500)
  ) {
    return "warning";
  }
  return "normal";
};

const sendWhatsAppNotification = async (feed) => {
  const { field1, field2, field3, status, created_at } = feed;
  const issues = [];

  if (status === "warning" || status === "danger") {
    const phValue = parseFloat(field1);
    const turbidityValue = parseFloat(field2);
    const tdsValue = parseFloat(field3);

    if (phValue < 6 || phValue > 8) {
      issues.push(`pH: ${field1}`);
    }
    if (turbidityValue >= 20) {
      issues.push(`Turbidity: ${field2} NTU`);
    }
    if (tdsValue >= 600) {
      issues.push(`TDS: ${field3} ppm`);
    }
  }

  if (issues.length === 0) return;

  const message = `⚠️ Status Kolam: ${status.toUpperCase()}
- Waktu: ${new Date(created_at).toLocaleString()}
- Masalah: ${issues.join(", ")}`;

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: "6287715256674, 15625752014",
        message: message,
      }),
    });

    const result = await response.json();
    if (result.status !== true) {
      console.error("Gagal kirim notifikasi:", result);
    } else {
      console.log("Berhasil kirim notifikasi:", result);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const fetchDataAndNotify = async () => {
  try {
    const response = await fetch(
      "https://api.thingspeak.com/channels/2725512/feeds.json?api_key=YOUR_API_KEY&results=1"
    );
    const jsonData = await response.json();
    const feeds = jsonData.feeds.map((feed) => {
      const status = calculateStatus(feed.field1, feed.field2, feed.field3);
      return { ...feed, status };
    });

    feeds
      .filter((feed) => feed.status === "warning" || feed.status === "danger")
      .forEach((feed) => sendWhatsAppNotification(feed));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

setInterval(fetchDataAndNotify, 900000);
fetchDataAndNotify();
