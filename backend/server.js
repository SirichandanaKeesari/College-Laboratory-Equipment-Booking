
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataFolder = path.join(__dirname, 'data');

function readData(fileName) {
  const filePath = path.join(dataFolder, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeData(fileName, data) {
  const filePath = path.join(dataFolder, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getStudents() {
  const data = readData('students.json');

  if (!data || !Array.isArray(data.students)) {
    throw new Error('Invalid students.json structure.');
  }

  return data.students;
}

function saveStudents(students) {
  writeData('students.json', { students });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue.'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Authentication configuration is missing.'
    });
  }

  try {
    req.student = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your session is invalid or expired. Please log in again.'
    });
  }
}

const timeSlots = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM'
];

function getEquipmentList() {
  const data = readData('equipment.json');
  return Array.isArray(data) ? data : data.equipment;
}

function getActiveBookings(bookings, equipmentId, date) {
  return bookings.filter(booking =>
    String(booking.equipmentId).toUpperCase() ===
      String(equipmentId).toUpperCase() &&
    booking.date === date &&
    booking.status !== 'CANCELLED'
  );
}

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'College Laboratory Equipment Booking System API'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running successfully!'
  });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { studentName, rollNumber, email, password } = req.body || {};

    if (
      typeof studentName !== 'string' ||
      !studentName.trim() ||
      typeof rollNumber !== 'string' ||
      !rollNumber.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password must not exceed 72 characters.'
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication configuration is missing.'
      });
    }

    const students = getStudents();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRoll = rollNumber.trim().toLowerCase();

    const existingStudent = students.find(student =>
      student.email.toLowerCase() === normalizedEmail ||
      student.rollNumber.toLowerCase() === normalizedRoll
    );

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or roll number already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const student = {
      id: crypto.randomUUID(),
      studentName: studentName.trim(),
      rollNumber: rollNumber.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    students.push(student);
    saveStudents(students);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      data: {
        id: student.id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to create your account.'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (
      typeof identifier !== 'string' ||
      !identifier.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email or roll number and password.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication configuration is missing.'
      });
    }

    const students = getStudents();
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const student = students.find(item =>
      item.email.toLowerCase() === normalizedIdentifier ||
      item.rollNumber.toLowerCase() === normalizedIdentifier
    );

    if (
      !student ||
      !student.passwordHash ||
      !(await bcrypt.compare(password, student.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/roll number or password.'
      });
    }

    const token = jwt.sign(
      {
        id: student.id,
        rollNumber: student.rollNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: student.id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to log in.'
    });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const students = getStudents();
    const student = students.find(item => item.id === req.student.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.'
      });
    }

    res.json({
      success: true,
      data: {
        id: student.id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve student profile.'
    });
  }
});

app.get('/api/equipment', (req, res) => {
  try {
    res.json({
      success: true,
      data: getEquipmentList()
    });
  } catch (error) {
    console.error('Equipment error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to read equipment data.'
    });
  }
});

app.get('/api/availability', (req, res) => {
  try {
    const { equipmentId, date } = req.query;

    if (!equipmentId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID and date are required.'
      });
    }

    const equipmentList = getEquipmentList();
    const equipment = equipmentList.find(item =>
      String(item.id).toUpperCase() === String(equipmentId).toUpperCase()
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.'
      });
    }

    const bookings = readData('bookings.json');

    if (!Array.isArray(bookings)) {
      throw new Error('Bookings data must be an array.');
    }

    const totalUnits = Number(equipment.total ?? equipment.available ?? 0);
    const dateBookings = getActiveBookings(bookings, equipmentId, date);

    const slots = timeSlots.map(timeSlot => {
      const bookedUnits = dateBookings.filter(
        booking => booking.timeSlot === timeSlot
      ).length;

      const availableUnits = Math.max(0, totalUnits - bookedUnits);

      return {
        timeSlot,
        bookedUnits,
        availableUnits,
        available: availableUnits > 0
      };
    });

    const availableUnits = slots.length
      ? Math.max(...slots.map(slot => slot.availableUnits))
      : totalUnits;

    res.json({
      success: true,
      data: {
        equipmentId: String(equipment.id),
        date,
        totalUnits,
        availableUnits,
        slots
      }
    });
  } catch (error) {
    console.error('Availability error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to check equipment availability.'
    });
  }
});

app.get('/api/bookings', authenticateToken, (req, res) => {
  try {
    const bookings = readData('bookings.json');

    if (!Array.isArray(bookings)) {
      throw new Error('Bookings data must be an array.');
    }

    const myBookings = bookings.filter(
      booking => booking.studentId === req.student.id
    );

    res.json({
      success: true,
      data: myBookings
    });
  } catch (error) {
    console.error('Bookings error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to read bookings.'
    });
  }
});

function generateBookingId(equipmentId, bookingDate, bookings) {
  const now = new Date();
  const datePart = bookingDate.replace(/-/g, '');

  const timePart =
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const prefix = `LS-${String(equipmentId).toUpperCase()}-${datePart}-${timePart}`;

  let sequence = 1;
  let bookingId = `${prefix}-${String(sequence).padStart(3, '0')}`;

  while (bookings.some(booking => booking.id === bookingId)) {
    sequence++;
    bookingId = `${prefix}-${String(sequence).padStart(3, '0')}`;
  }

  return bookingId;
}

app.post('/api/bookings', authenticateToken, (req, res) => {
  try {
    const { equipmentId, date, timeSlot } = req.body || {};

    if (!equipmentId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details.'
      });
    }

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    let isValidDate = false;

    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      const parsedDate = new Date(year, month - 1, day);

      isValidDate =
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day;
    }

    const today = new Date();
    const todayString =
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (!isValidDate || date < todayString) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid current or future date.'
      });
    }

    const equipmentList = getEquipmentList();
    const equipment = equipmentList.find(item =>
      String(item.id).toUpperCase() === String(equipmentId).toUpperCase()
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found.'
      });
    }

    if (!timeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid time slot.'
      });
    }

    const students = getStudents();
    const student = students.find(item => item.id === req.student.id);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Student account not found. Please log in again.'
      });
    }

    const bookings = readData('bookings.json');

    if (!Array.isArray(bookings)) {
      throw new Error('Bookings data must be an array.');
    }

    const totalUnits = Number(equipment.total ?? equipment.available ?? 0);

    const conflictingBookings = getActiveBookings(
      bookings,
      equipment.id,
      date
    ).filter(booking => booking.timeSlot === timeSlot);

    if (conflictingBookings.length >= totalUnits) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is fully booked for the selected equipment.'
      });
    }

    const booking = {
      id: generateBookingId(equipment.id, date, bookings),
      studentId: student.id,
      equipmentId: String(equipment.id),
      equipmentName: equipment.name,
      studentName: student.studentName,
      rollNumber: student.rollNumber,
      email: student.email,
      date,
      timeSlot,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    writeData('bookings.json', bookings);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to create booking.'
    });
  }
});

app.patch('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  try {
    const bookings = readData('bookings.json');

    if (!Array.isArray(bookings)) {
      throw new Error('Bookings data must be an array.');
    }

    const booking = bookings.find(
      item =>
        String(item.id) === String(req.params.id) &&
        item.studentId === req.student.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for your account.'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.'
      });
    }

    booking.status = 'CANCELLED';
    writeData('bookings.json', bookings);

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to cancel booking.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
