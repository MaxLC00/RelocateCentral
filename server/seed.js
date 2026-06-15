require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Announcement = require("./models/Announcement");
const Unit = require("./models/Unit");

const announcements = [
  {
    title: "Move out begins on June 10th",
    body: "Resident move out officially begins on June 10th. Please review your scheduled move out date and reach out to the relocation team with any questions.",
    category: "relocation",
    pinned: true,
    author: "Relocation Team",
  },
  {
    title: "Gift card pick up will be available with move out confirmation",
    body: "Once your move out is confirmed, you will be able to pick up your gift card. Bring your move out confirmation to claim it.",
    category: "general",
    author: "Allerton Building Management",
  },
];

// Floor is derived from the first digit(s): e.g. 206 -> 2, 1010 -> 10
function floor(unitNumber) {
  return Math.floor(parseInt(unitNumber, 10) / 100);
}

function unit(unitNumber, group) {
  return { unitNumber: String(unitNumber), floor: floor(unitNumber), group };
}

const units = [
  // Group 1
  unit(206, 1), unit(207, 1), unit(208, 1), unit(209, 1), unit(210, 1),
  unit(211, 1), unit(212, 1), unit(304, 1), unit(305, 1), unit(306, 1),
  unit(307, 1), unit(308, 1), unit(309, 1), unit(310, 1), unit(311, 1),
  unit(406, 1), unit(408, 1), unit(409, 1), unit(410, 1), unit(415, 1),
  unit(506, 1), unit(508, 1), unit(509, 1), unit(510, 1), unit(515, 1),
  unit(606, 1), unit(608, 1), unit(609, 1), unit(610, 1), unit(615, 1),
  unit(706, 1), unit(708, 1), unit(709, 1), unit(710, 1), unit(715, 1),
  unit(806, 1), unit(808, 1), unit(809, 1), unit(810, 1), unit(815, 1),
  unit(906, 1), unit(908, 1), unit(909, 1), unit(910, 1), unit(915, 1),
  unit(1006, 1), unit(1008, 1), unit(1009, 1), unit(1010, 1), unit(1015, 1),
  unit(1106, 1), unit(1108, 1), unit(1109, 1), unit(1110, 1), unit(1115, 1),
  unit(1206, 1), unit(1208, 1), unit(1209, 1), unit(1210, 1), unit(1215, 1),
  unit(1406, 1), unit(1408, 1), unit(1409, 1), unit(1410, 1), unit(1415, 1),
  unit(1506, 1), unit(1508, 1), unit(1509, 1), unit(1510, 1), unit(1515, 1),
  unit(1605, 1), unit(1606, 1), unit(1608, 1), unit(1609, 1), unit(1614, 1),
  unit(1702, 1),

  // Group 2
  unit(201, 2), unit(202, 2), unit(203, 2), unit(204, 2), unit(205, 2),
  unit(214, 2), unit(215, 2), unit(216, 2), unit(217, 2), unit(301, 2),
  unit(302, 2), unit(303, 2), unit(312, 2), unit(314, 2), unit(315, 2),
  unit(401, 2), unit(402, 2), unit(403, 2), unit(404, 2), unit(405, 2),
  unit(407, 2), unit(411, 2), unit(412, 2), unit(414, 2),

  // Group 3
  unit(501, 3), unit(502, 3), unit(503, 3), unit(504, 3), unit(505, 3),
  unit(507, 3), unit(511, 3), unit(512, 3), unit(514, 3), unit(601, 3),
  unit(602, 3), unit(603, 3), unit(604, 3), unit(605, 3), unit(607, 3),
  unit(611, 3), unit(612, 3), unit(614, 3), unit(701, 3), unit(702, 3),
  unit(703, 3), unit(704, 3), unit(705, 3), unit(707, 3), unit(711, 3),
  unit(712, 3), unit(714, 3), unit(801, 3), unit(802, 3), unit(803, 3),
  unit(804, 3), unit(805, 3), unit(807, 3), unit(811, 3), unit(812, 3),
  unit(814, 3),

  // Group 4
  unit(901, 4), unit(902, 4), unit(903, 4), unit(904, 4), unit(905, 4),
  unit(907, 4), unit(911, 4), unit(912, 4), unit(914, 4), unit(1001, 4),
  unit(1002, 4), unit(1003, 4), unit(1004, 4), unit(1005, 4), unit(1007, 4),
  unit(1011, 4), unit(1012, 4), unit(1014, 4), unit(1101, 4), unit(1102, 4),
  unit(1103, 4), unit(1104, 4), unit(1105, 4), unit(1107, 4), unit(1111, 4),
  unit(1112, 4), unit(1114, 4), unit(1201, 4), unit(1202, 4), unit(1203, 4),
  unit(1204, 4), unit(1205, 4), unit(1207, 4), unit(1211, 4), unit(1212, 4),
  unit(1214, 4), unit(1401, 4), unit(1402, 4), unit(1403, 4), unit(1404, 4),
  unit(1405, 4), unit(1407, 4), unit(1411, 4), unit(1412, 4), unit(1414, 4),

  // Group 5
  unit(1501, 5), unit(1502, 5), unit(1503, 5), unit(1504, 5), unit(1505, 5),
  unit(1507, 5), unit(1511, 5), unit(1512, 5), unit(1514, 5), unit(1601, 5),
  unit(1602, 5), unit(1603, 5), unit(1604, 5), unit(1607, 5), unit(1610, 5),
  unit(1611, 5), unit(1612, 5), unit(1701, 5),
];

async function seed() {
  try {
    await connectDB();

    await Announcement.deleteMany({});
    await Unit.deleteMany({});

    await Announcement.insertMany(announcements);
    await Unit.insertMany(units);

    console.log(
      `Seeded ${announcements.length} announcements and ${units.length} units.`
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
