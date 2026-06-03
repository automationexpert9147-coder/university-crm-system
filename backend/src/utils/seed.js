require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const seed = async () => {
  console.log('Seeding Supabase database...');

  // Clear existing data (order matters due to FK constraints)
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('grades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('learning_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const hash = await bcrypt.hash('password123', 12);

  // Create users
  const { data: users, error: usersErr } = await supabase.from('users').insert([
    { name: 'Admin User',      email: 'admin@uaf.edu',   password: hash, role: 'admin',   department: 'Computer Science' },
    { name: 'Dr. Ahmad Ali',   email: 'teacher@uaf.edu', password: hash, role: 'teacher', department: 'Computer Science' },
    { name: 'Prof. Fatima',    email: 'fatima@uaf.edu',  password: hash, role: 'teacher', department: 'Software Engineering' },
    { name: 'Muhammad Usman',  email: 'student@uaf.edu', password: hash, role: 'student', department: 'Computer Science', roll_number: '2021-CS-001', semester: '5' },
    { name: 'Ayesha Raza',     email: 'ayesha@uaf.edu',  password: hash, role: 'student', department: 'Computer Science', roll_number: '2021-CS-002', semester: '5' },
    { name: 'Ali Hassan',      email: 'ali@uaf.edu',     password: hash, role: 'student', department: 'Software Engineering', roll_number: '2021-SE-001', semester: '3' },
  ]).select('id, name, email, role');

  if (usersErr) { console.error('Users error:', usersErr.message); process.exit(1); }

  const teacher1 = users.find(u => u.email === 'teacher@uaf.edu');
  const teacher2 = users.find(u => u.email === 'fatima@uaf.edu');
  const student1 = users.find(u => u.email === 'student@uaf.edu');
  const student2 = users.find(u => u.email === 'ayesha@uaf.edu');
  const student3 = users.find(u => u.email === 'ali@uaf.edu');

  // Create courses
  const { data: courses, error: courseErr } = await supabase.from('courses').insert([
    { name: 'Data Structures & Algorithms', code: 'CS-301', teacher_id: teacher1.id, semester: 5, department: 'Computer Science', credit_hours: 3, description: 'Core DSA concepts.' },
    { name: 'Database Management Systems',  code: 'CS-302', teacher_id: teacher1.id, semester: 5, department: 'Computer Science', credit_hours: 3 },
    { name: 'Software Engineering',         code: 'SE-201', teacher_id: teacher2.id, semester: 3, department: 'Software Engineering', credit_hours: 3 },
  ]).select('id, name, code');

  if (courseErr) { console.error('Courses error:', courseErr.message); process.exit(1); }

  const [cs301, cs302, se201] = courses;

  // Enrollments
  await supabase.from('enrollments').insert([
    { student_id: student1.id, course_id: cs301.id },
    { student_id: student1.id, course_id: cs302.id },
    { student_id: student2.id, course_id: cs301.id },
    { student_id: student2.id, course_id: cs302.id },
    { student_id: student3.id, course_id: se201.id },
  ]);

  // Sample tasks
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 7);
  await supabase.from('tasks').insert([
    { title: 'Assignment 1: Arrays & Linked Lists', description: 'Implement basic array and linked list operations.', course_id: cs301.id, teacher_id: teacher1.id, type: 'assignment', due_date: tomorrow.toISOString(), total_marks: 20 },
    { title: 'Lab 1: SQL Queries',                 description: 'Write SQL queries for given scenarios.',            course_id: cs302.id, teacher_id: teacher1.id, type: 'lab',        due_date: tomorrow.toISOString(), total_marks: 15 },
  ]);

  // Sample attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: att } = await supabase.from('attendance').insert({ course_id: cs301.id, date: today, marked_by: teacher1.id }).select('id').single();
  if (att) {
    await supabase.from('attendance_records').insert([
      { attendance_id: att.id, student_id: student1.id, status: 'present' },
      { attendance_id: att.id, student_id: student2.id, status: 'present' },
    ]);
  }

  console.log('\n✅ Supabase seed complete!\n');
  console.log('Demo Accounts:');
  console.log('  Admin:    admin@uaf.edu   | password123');
  console.log('  Teacher:  teacher@uaf.edu | password123');
  console.log('  Student:  student@uaf.edu | password123');
  console.log('  Student:  ayesha@uaf.edu  | password123');
};

seed().catch(err => { console.error(err); process.exit(1); });
