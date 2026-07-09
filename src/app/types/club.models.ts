export type UserRole = 'Visitor' | 'Member' | 'Officer' | 'Admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'closed' | 'completed';
export type RegistrationStatus = 'registered' | 'cancelled' | 'completed' | 'waitlisted';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type AnnouncementStatus = 'draft' | 'published';
export type ClubStatus = 'pending' | 'active' | 'closed';
export type ClubMemberStatus = 'active' | 'pending' | 'suspended';
export type RoleInClub = 'President' | 'Officer' | 'Member';
export type SessionStatus = 'open' | 'closed' | 'completed';

export interface ClubUser {
  id: string;
  avatar: string;
  name: string;
  studentId: string;
  department: string;
  grade: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  category: string;
  tags: string[];
  status: ClubStatus;
  createdBy: string;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  roleInClub: RoleInClub;
  status: ClubMemberStatus;
  joinedAt: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  cover: string;
  description: string;
  agenda: string[];
  location: string;
  startTime: string;
  endTime: string;
  deadline: string;
  capacity: number;
  currentCount: number;
  category: string;
  tags: string[];
  status: EventStatus;
  createdBy: string;
  createdAt: string;
}

export interface Session {
  id: string;
  eventId: string;
  clubId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  currentCount: number;
  openToNonMember: boolean;
  status: SessionStatus;
  createdAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  clubId: string;
  eventId: string;
  sessionId: string;
  paymentStatus: PaymentStatus;
  checkIn: boolean;
  status: RegistrationStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  clubId: string | null;
  title: string;
  content: string;
  cover: string;
  category: string;
  isPinned: boolean;
  status: AnnouncementStatus;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'event' | 'announcement' | 'review';
  isRead: boolean;
  createdAt: string;
}
