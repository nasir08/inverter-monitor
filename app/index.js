const { SerialPort } = require("serialport"); // Correct import
const { ReadlineParser } = require("@serialport/parser-readline"); // Import the Readline parser
const mongoose = require("mongoose");
const express = require("express");

// MongoDB connection
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/inverter-monitor";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a schema and model for inverter data
const InverterStat = mongoose.model(
  "InverterStat",
  new mongoose.Schema({
    voltage: { type: Number, required: true },
    current: { type: Number, required: true },
    power: { type: Number, required: true },
    batteryLevel: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  })
);

// Serial port setup
const portPath = process.env.SERIAL_PORT || "/dev/tty.usbserial-FTB6SPL3";
const baudRate = parseInt(process.env.BAUD_RATE, 10) || 9600;

const port = new SerialPort({ path: portPath, baudRate: baudRate }, (err) => {
  if (err) {
    return console.error("Error opening serial port:", err.message);
  }
  console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// Event listener for serial data
parser.on("data", (data) => {
  console.log("Received inverter stats:", data);

  // Parse the inverter data and save to MongoDB
  const inverterStats = parseInverterStats(data);
  if (inverterStats) {
    const stats = new InverterStat(inverterStats);
    stats
      .save()
      .then(() => console.log("Data saved to MongoDB"))
      .catch((err) => console.error("Error saving data to MongoDB:", err));
  } else {
    console.error("Invalid data received, skipping save.");
  }
});

// Function to parse the inverter data
function parseInverterStats(data) {
  try {
    const voltage = extractVoltage(data);
    const current = extractCurrent(data);
    const power = extractPower(data);
    const batteryLevel = extractBatteryLevel(data);

    if (
      !isNaN(voltage) &&
      !isNaN(current) &&
      !isNaN(power) &&
      !isNaN(batteryLevel)
    ) {
      return { voltage, current, power, batteryLevel };
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error parsing data:", err);
    return null;
  }
}

// Placeholder functions for data extraction
function extractVoltage(data) {
  return 12.5;
}
function extractCurrent(data) {
  return 10;
}
function extractPower(data) {
  return 120;
}
function extractBatteryLevel(data) {
  return 80;
}

// --- Express API Setup ---
const app = express();
const apiPort = process.env.PORT || 3000;

app.get("/api/inverter-stats", async (req, res) => {
  try {
    const latestData = await InverterStat.find()
      .sort({ timestamp: -1 })
      .limit(1);
    if (latestData.length > 0) {
      res.json(latestData[0]);
    } else {
      res.status(404).json({ message: "No data available" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching data", error: err });
  }
});

app.listen(apiPort, () => {
  console.log(`Server running on port ${apiPort}`);
});
