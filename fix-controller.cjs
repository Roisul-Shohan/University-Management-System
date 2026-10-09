const fs = require('fs');
let content = fs.readFileSync('C:/Users/ACER/university-management-system/src/modules/dashboard/dashboard.controller.ts.bak', 'utf8');
content = content.replace(
    '        include: { studentSemester: { include: { student: { include: { user: { select: { name: true } } } } }, exam: { select: { title: true } } }',
    '        include: { studentSemester: { include: { student: { include: { user: { select: { name: true } } } } }, exam: { select: { title: true } } },'
);
content = content.replace(
    '        include: { studentSemester: { include: { student: { include: { user: { select: { name: true } } } } }, courseOffering: { include: { course: { select: { code: true } } } } }',
    '        include: { studentSemester: { include: { student: { include: { user: { select: { name: true } } } } }, courseOffering: { include: { course: { select: { code: true } } } },'
);
content = content.replace(
    '        include: { courseEnrollments: { where: { status: EnrollmentStatus.ENROLLED }, include: { courseOffering: { include: { classSessions: { where: { startTime: { gte: new Date() } }, orderBy: { startTime: "asc" }, take: 5, include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } } } } } }',
    '        include: { courseEnrollments: { where: { status: EnrollmentStatus.ENROLLED }, include: { courseOffering: { include: { classSessions: { where: { startTime: { gte: new Date() } }, orderBy: { startTime: "asc" }, take: 5, include: { courseOffering: { include: { course: { select: { code: true, name: true } } } } } } } },'
);
fs.writeFileSync('C:/Users/ACER/university-management-system/src/modules/dashboard/dashboard.controller.ts', content, 'utf8');
console.log('Fixed');