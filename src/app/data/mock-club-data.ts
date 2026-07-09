import { Announcement, Club, ClubEvent, ClubMember, ClubUser, Notification, Registration, Session } from '../types/club.models';

export const users: ClubUser[] = [
  { id: '1', avatar: 'BC', name: 'Barry Chen', studentId: 'S1120001', department: '資訊管理系', grade: '三年級', email: 'barry@example.com', phone: '0912-345-678', role: 'Member', status: 'active', createdAt: '2026-02-12T08:30:00' },
  { id: '2', avatar: 'AL', name: 'Amy Lin', studentId: 'S1110028', department: '企業管理系', grade: '四年級', email: 'amy@example.com', phone: '0922-556-018', role: 'Officer', status: 'active', createdAt: '2025-09-16T13:20:00' },
  { id: '3', avatar: 'KW', name: 'Kevin Wu', studentId: 'S1130108', department: '設計系', grade: '二年級', email: 'kevin@example.com', phone: '0930-441-266', role: 'Admin', status: 'active', createdAt: '2025-08-21T09:10:00' },
];

export const clubs: Club[] = [
  { id: 'c1', name: '資管系學會', logo: '資', cover: 'linear-gradient(135deg, #2563eb, #14b8a6)', description: '資訊管理系的學生自治與活動社團。', category: '系學會', tags: ['資管', '系學會'], status: 'active', createdBy: '3', createdAt: '2025-08-21T09:10:00' },
  { id: 'c2', name: '街舞社', logo: '舞', cover: 'linear-gradient(135deg, #f97316, #eab308)', description: '熱愛街舞與編舞的社團。', category: '表演藝術', tags: ['舞蹈', '表演'], status: 'active', createdBy: '2', createdAt: '2025-09-16T13:20:00' },
];

export const clubMembers: ClubMember[] = [
  { id: 'cm1', userId: '3', clubId: 'c1', roleInClub: 'President', status: 'active', joinedAt: '2025-08-21T09:10:00' },
  { id: 'cm2', userId: '2', clubId: 'c1', roleInClub: 'Officer', status: 'active', joinedAt: '2025-09-16T13:20:00' },
  { id: 'cm3', userId: '1', clubId: 'c1', roleInClub: 'Member', status: 'active', joinedAt: '2026-02-12T08:30:00' },
  { id: 'cm4', userId: '2', clubId: 'c2', roleInClub: 'President', status: 'active', joinedAt: '2025-09-16T13:20:00' },
];

export const events: ClubEvent[] = [
  { id: 'e101', clubId: 'c1', title: '新生社團體驗夜', cover: 'linear-gradient(135deg, #2563eb, #14b8a6)', description: '用一個晚上認識社團文化、幹部團隊與年度活動，現場開放社員交流與小組體驗。', agenda: ['18:30 報到與自由交流', '19:00 社團介紹', '19:40 分組體驗', '20:30 Q&A 與報名說明'], location: '學生活動中心 2F', startTime: '2026-07-04T18:30:00', endTime: '2026-07-04T21:00:00', deadline: '2026-07-02T23:59:00', capacity: 80, currentCount: 52, category: '招生活動', tags: ['新生', '體驗', '交流'], status: 'published', createdBy: '2', createdAt: '2026-06-20T10:00:00' },
  { id: 'e102', clubId: 'c1', title: '專題企劃工作坊', cover: 'linear-gradient(135deg, #f97316, #eab308)', description: '從問題定義、活動企劃到預算規劃，帶你完成一份可以執行的社團專題企劃。', agenda: ['09:30 企劃案例拆解', '10:30 小組構想', '13:00 預算與時程', '15:00 成果發表'], location: '管理學院 M305', startTime: '2026-07-13T09:30:00', endTime: '2026-07-13T16:00:00', deadline: '2026-07-08T23:59:00', capacity: 40, currentCount: 31, category: '工作坊', tags: ['企劃', '幹部培訓'], status: 'published', createdBy: '2', createdAt: '2026-06-18T15:10:00' },
  { id: 'e201', clubId: 'c2', title: '期中成果展', cover: 'linear-gradient(135deg, #7c3aed, #ec4899)', description: '街舞社期中成果展，開放全校師生免費觀賞。', agenda: ['18:00 開場', '18:20 分組演出', '20:00 大齊舞'], location: '學生活動中心 1F', startTime: '2026-07-20T18:00:00', endTime: '2026-07-20T20:30:00', deadline: '2026-07-18T23:59:00', capacity: 150, currentCount: 88, category: '成果發表', tags: ['舞蹈', '公開活動'], status: 'published', createdBy: '2', createdAt: '2026-06-22T11:45:00' },
];

export const sessions: Session[] = [
  { id: 's1', eventId: 'e101', clubId: 'c1', title: '第一場次', startTime: '2026-07-04T18:30:00', endTime: '2026-07-04T19:30:00', location: '學生活動中心 2F', capacity: 40, currentCount: 20, openToNonMember: true, status: 'open', createdAt: '2026-06-20T10:00:00' },
  { id: 's2', eventId: 'e101', clubId: 'c1', title: '第二場次', startTime: '2026-07-04T19:30:00', endTime: '2026-07-04T21:00:00', location: '學生活動中心 2F', capacity: 40, currentCount: 32, openToNonMember: false, status: 'open', createdAt: '2026-06-20T10:00:00' },
  { id: 's3', eventId: 'e102', clubId: 'c1', title: '工作坊全場次', startTime: '2026-07-13T09:30:00', endTime: '2026-07-13T16:00:00', location: '管理學院 M305', capacity: 40, currentCount: 31, openToNonMember: false, status: 'open', createdAt: '2026-06-18T15:10:00' },
];

export const registrations: Registration[] = [
  { id: 'r9001', userId: '1', clubId: 'c1', eventId: 'e101', sessionId: 's1', paymentStatus: 'paid', checkIn: false, status: 'registered', createdAt: '2026-06-22T12:20:00' },
  { id: 'r9002', userId: '1', clubId: 'c1', eventId: 'e102', sessionId: 's3', paymentStatus: 'unpaid', checkIn: false, status: 'registered', createdAt: '2026-06-23T18:40:00' },
  { id: 'r9003', userId: '1', clubId: 'c2', eventId: 'e201', sessionId: 's4', paymentStatus: 'paid', checkIn: true, status: 'completed', createdAt: '2026-06-24T08:00:00' },
];

export const announcements: Announcement[] = [
  { id: '501', clubId: 'c1', title: '期末社員大會通知', content: '社員大會將說明下學期活動方向、幹部交接與財務摘要，請正式社員準時出席。', cover: 'linear-gradient(135deg, #0f766e, #22c55e)', category: '重要公告', isPinned: true, status: 'published', createdBy: '3', createdAt: '2026-06-21T09:00:00' },
  { id: '502', clubId: 'c1', title: '暑期活動志工招募', content: '招募活動接待、場控、攝影與紀錄志工，完成服務可列入社團服務時數。', cover: 'linear-gradient(135deg, #2563eb, #0891b2)', category: '招募', isPinned: false, status: 'published', createdBy: '2', createdAt: '2026-06-19T14:20:00' },
  { id: '503', clubId: 'c2', title: '期中成果展免費觀賞', content: '歡迎全校師生免費入場觀賞街舞社期中成果展。', cover: 'linear-gradient(135deg, #7c3aed, #ec4899)', category: '活動', isPinned: false, status: 'published', createdBy: '2', createdAt: '2026-06-16T10:30:00' },
];

export const notifications: Notification[] = [
  { id: '7001', userId: '1', title: '活動提醒：新生社團體驗夜', content: '你報名的活動將於 2026/07/04 18:30 開始，請提前 10 分鐘報到。', type: 'event', isRead: false, createdAt: '2026-06-25T08:00:00' },
  { id: '7002', userId: '1', title: '公告通知：期末社員大會', content: '請確認大會時間與出席狀態。', type: 'announcement', isRead: true, createdAt: '2026-06-21T10:00:00' },
  { id: '7003', userId: '1', title: '審核通知：社員資料已通過', content: '你的社員資料已審核完成，可以使用活動報名功能。', type: 'review', isRead: true, createdAt: '2026-06-18T17:30:00' },
];
