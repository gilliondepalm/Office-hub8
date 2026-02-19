import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";

const ALL_MODULES = ["dashboard", "kalender", "aankondigingen", "organisatie", "personalia", "verzuim", "beloningen", "applicaties", "beheer"];
const MANAGER_MODULES = ["dashboard", "kalender", "aankondigingen", "organisatie", "personalia", "verzuim", "beloningen", "applicaties"];
const EMPLOYEE_MODULES = ["dashboard", "kalender", "aankondigingen", "verzuim", "beloningen"];

export async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length > 0) return;

  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedUser = await bcrypt.hash("user123", 10);

  const admin = await storage.createUser({
    username: "admin",
    password: hashedAdmin,
    fullName: "Jan de Vries",
    email: "jan.devries@kantoor.nl",
    role: "admin",
    department: "IT",
    avatar: null,
    active: true,
    permissions: ALL_MODULES,
    startDate: "2018-03-01",
    endDate: null,
    birthDate: "1980-05-12",
  });

  const manager = await storage.createUser({
    username: "manager",
    password: hashedUser,
    fullName: "Maria Jansen",
    email: "maria.jansen@kantoor.nl",
    role: "manager",
    department: "HR",
    avatar: null,
    active: true,
    permissions: MANAGER_MODULES,
    startDate: "2019-06-15",
    endDate: null,
    birthDate: "1985-11-23",
  });

  const emp1 = await storage.createUser({
    username: "pieter",
    password: hashedUser,
    fullName: "Pieter Bakker",
    email: "pieter.bakker@kantoor.nl",
    role: "employee",
    department: "Marketing",
    avatar: null,
    active: true,
    permissions: EMPLOYEE_MODULES,
    startDate: "2021-01-10",
    endDate: null,
    birthDate: "1992-03-08",
  });

  const emp2 = await storage.createUser({
    username: "sophie",
    password: hashedUser,
    fullName: "Sophie van Dijk",
    email: "sophie.vandijk@kantoor.nl",
    role: "employee",
    department: "Financien",
    avatar: null,
    active: true,
    permissions: EMPLOYEE_MODULES,
    startDate: "2020-09-01",
    endDate: null,
    birthDate: "1990-07-15",
  });

  const emp3 = await storage.createUser({
    username: "thomas",
    password: hashedUser,
    fullName: "Thomas Mulder",
    email: "thomas.mulder@kantoor.nl",
    role: "employee",
    department: "IT",
    avatar: null,
    active: true,
    permissions: EMPLOYEE_MODULES,
    startDate: "2024-11-01",
    endDate: null,
    birthDate: "1995-12-30",
  });

  await storage.createDepartment({ name: "IT", description: "Informatie technologie en systeembeheer", managerId: admin.id });
  await storage.createDepartment({ name: "HR", description: "Human Resources en personeelszaken", managerId: manager.id });
  await storage.createDepartment({ name: "Marketing", description: "Marketing en communicatie", managerId: null });
  await storage.createDepartment({ name: "Financien", description: "Financiele administratie en boekhouding", managerId: null });

  const today = new Date();
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 30);
  const in2Weeks = new Date(today); in2Weeks.setDate(today.getDate() + 14);
  const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);

  await storage.createEvent({
    title: "Teamvergadering Q1",
    description: "Kwartaaloverzicht en planning voor het komende kwartaal",
    date: nextWeek.toISOString().split("T")[0],
    endDate: null,
    time: "10:00",
    location: "Vergaderzaal A",
    category: "vergadering",
    createdBy: admin.id,
  });

  await storage.createEvent({
    title: "Training Nieuwe Software",
    description: "Introductie van het nieuwe projectmanagementsysteem",
    date: in2Weeks.toISOString().split("T")[0],
    endDate: null,
    time: "14:00",
    location: "Trainingsruimte",
    category: "training",
    createdBy: admin.id,
  });

  await storage.createEvent({
    title: "Bedrijfsborrel",
    description: "Informele netwerkborrel voor alle medewerkers",
    date: nextMonth.toISOString().split("T")[0],
    endDate: null,
    time: "17:00",
    location: "Kantoorterras",
    category: "sociaal",
    createdBy: manager.id,
  });

  await storage.createEvent({
    title: "Projectdeadline Website",
    description: "Oplevering van de nieuwe bedrijfswebsite",
    date: in3Days.toISOString().split("T")[0],
    endDate: null,
    time: null,
    location: null,
    category: "deadline",
    createdBy: admin.id,
  });

  await storage.createAnnouncement({
    title: "Kantoor gesloten op Koningsdag",
    content: "Op 27 april is het kantoor gesloten i.v.m. Koningsdag. Wij wensen iedereen een fijne dag!",
    priority: "high",
    pinned: true,
    createdBy: admin.id,
  });

  await storage.createAnnouncement({
    title: "Nieuwe parkeerregeling",
    content: "Vanaf volgende maand geldt een nieuwe parkeerregeling. Raadpleeg het intranet voor meer informatie.",
    priority: "medium",
    pinned: false,
    createdBy: manager.id,
  });

  await storage.createAnnouncement({
    title: "Welkom Thomas Mulder",
    content: "Wij verwelkomen Thomas Mulder als nieuwe collega bij de afdeling IT. Veel succes Thomas!",
    priority: "normal",
    pinned: false,
    createdBy: admin.id,
  });

  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in5Days = new Date(today); in5Days.setDate(today.getDate() + 5);
  const in10Days = new Date(today); in10Days.setDate(today.getDate() + 10);
  const in15Days = new Date(today); in15Days.setDate(today.getDate() + 15);

  await storage.createAbsence({
    userId: emp1.id,
    type: "vacation",
    startDate: in5Days.toISOString().split("T")[0],
    endDate: in15Days.toISOString().split("T")[0],
    reason: "Zomervakantie naar Spanje",
    status: "pending",
    approvedBy: null,
  });

  await storage.createAbsence({
    userId: emp2.id,
    type: "sick",
    startDate: today.toISOString().split("T")[0],
    endDate: in3Days.toISOString().split("T")[0],
    reason: "Griep",
    status: "approved",
    approvedBy: manager.id,
  });

  await storage.createAbsence({
    userId: emp3.id,
    type: "personal",
    startDate: in10Days.toISOString().split("T")[0],
    endDate: in10Days.toISOString().split("T")[0],
    reason: "Verhuizing",
    status: "pending",
    approvedBy: null,
  });

  await storage.createReward({ userId: emp1.id, points: 50, reason: "Uitstekende klantpresentatie", awardedBy: manager.id });
  await storage.createReward({ userId: emp2.id, points: 30, reason: "Extra inzet bij projectdeadline", awardedBy: admin.id });
  await storage.createReward({ userId: emp3.id, points: 25, reason: "Succesvol onboardingproces afgerond", awardedBy: manager.id });
  await storage.createReward({ userId: emp1.id, points: 15, reason: "Mentoring van nieuwe collega", awardedBy: admin.id });
  await storage.createReward({ userId: admin.id, points: 40, reason: "Implementatie nieuw IT-systeem", awardedBy: manager.id });

  const app1 = await storage.createApplication({
    name: "Microsoft 365",
    description: "Office-suite met e-mail, documenten en samenwerkingstools",
    url: "https://office.com",
    icon: null,
  });

  const app2 = await storage.createApplication({
    name: "Slack",
    description: "Team-communicatieplatform voor berichten en videobellen",
    url: "https://slack.com",
    icon: null,
  });

  const app3 = await storage.createApplication({
    name: "Jira",
    description: "Projectmanagement en issue-tracking voor softwareteams",
    url: "https://jira.com",
    icon: null,
  });

  const app4 = await storage.createApplication({
    name: "SAP",
    description: "Enterprise resource planning en bedrijfsbeheer",
    url: null,
    icon: null,
  });

  await storage.createAppAccess({ userId: admin.id, applicationId: app1.id, accessLevel: "admin" });
  await storage.createAppAccess({ userId: admin.id, applicationId: app2.id, accessLevel: "admin" });
  await storage.createAppAccess({ userId: admin.id, applicationId: app3.id, accessLevel: "admin" });
  await storage.createAppAccess({ userId: manager.id, applicationId: app1.id, accessLevel: "write" });
  await storage.createAppAccess({ userId: manager.id, applicationId: app2.id, accessLevel: "write" });
  await storage.createAppAccess({ userId: emp1.id, applicationId: app1.id, accessLevel: "read" });
  await storage.createAppAccess({ userId: emp1.id, applicationId: app2.id, accessLevel: "read" });
  await storage.createAppAccess({ userId: emp2.id, applicationId: app1.id, accessLevel: "read" });
  await storage.createAppAccess({ userId: emp2.id, applicationId: app4.id, accessLevel: "write" });

  // Position History - Functie & salarisontwikkeling
  await storage.createPositionHistory({ userId: admin.id, functionTitle: "IT Beheerder", startDate: "2018-03-01", endDate: "2020-06-30", salary: 3200, notes: "Startfunctie" });
  await storage.createPositionHistory({ userId: admin.id, functionTitle: "Senior IT Beheerder", startDate: "2020-07-01", endDate: "2022-12-31", salary: 3800, notes: "Promotie na 2 jaar" });
  await storage.createPositionHistory({ userId: admin.id, functionTitle: "IT Manager", startDate: "2023-01-01", endDate: null, salary: 4500, notes: "Leidinggevende rol" });

  await storage.createPositionHistory({ userId: manager.id, functionTitle: "HR Medewerker", startDate: "2019-06-15", endDate: "2021-12-31", salary: 2900, notes: "Instap HR" });
  await storage.createPositionHistory({ userId: manager.id, functionTitle: "HR Manager", startDate: "2022-01-01", endDate: null, salary: 3600, notes: "Promotie naar management" });

  await storage.createPositionHistory({ userId: emp1.id, functionTitle: "Marketing Assistent", startDate: "2021-01-10", endDate: "2023-03-31", salary: 2500, notes: "Startfunctie" });
  await storage.createPositionHistory({ userId: emp1.id, functionTitle: "Marketing Specialist", startDate: "2023-04-01", endDate: null, salary: 3100, notes: "Doorgegroeid" });

  await storage.createPositionHistory({ userId: emp2.id, functionTitle: "Financieel Medewerker", startDate: "2020-09-01", endDate: null, salary: 2800, notes: "Startfunctie" });

  await storage.createPositionHistory({ userId: emp3.id, functionTitle: "Junior IT Developer", startDate: "2024-11-01", endDate: null, salary: 2600, notes: "Nieuwe medewerker" });

  // Personal Development - Opleidingen & Trainingen
  await storage.createPersonalDevelopment({ userId: admin.id, trainingName: "ITIL Foundation", startDate: "2019-01-15", endDate: "2019-03-20", completed: true });
  await storage.createPersonalDevelopment({ userId: admin.id, trainingName: "Azure Cloud Certificering", startDate: "2021-06-01", endDate: "2021-09-15", completed: true });
  await storage.createPersonalDevelopment({ userId: admin.id, trainingName: "Leiderschapstraining", startDate: "2025-09-01", endDate: null, completed: false });

  await storage.createPersonalDevelopment({ userId: manager.id, trainingName: "HR Management Opleiding", startDate: "2020-02-01", endDate: "2020-06-30", completed: true });
  await storage.createPersonalDevelopment({ userId: manager.id, trainingName: "Arbeidsrecht Cursus", startDate: "2022-09-01", endDate: "2022-12-15", completed: true });

  await storage.createPersonalDevelopment({ userId: emp1.id, trainingName: "Google Analytics Certificaat", startDate: "2021-04-01", endDate: "2021-06-30", completed: true });
  await storage.createPersonalDevelopment({ userId: emp1.id, trainingName: "Content Marketing Strategie", startDate: "2023-09-01", endDate: "2024-01-15", completed: true });
  await storage.createPersonalDevelopment({ userId: emp1.id, trainingName: "SEO Specialisatie", startDate: "2025-03-01", endDate: null, completed: false });

  await storage.createPersonalDevelopment({ userId: emp2.id, trainingName: "Boekhoudkundig Medewerker", startDate: "2021-01-10", endDate: "2021-07-20", completed: true });
  await storage.createPersonalDevelopment({ userId: emp2.id, trainingName: "Excel Gevorderd", startDate: "2023-03-01", endDate: "2023-04-15", completed: true });

  await storage.createPersonalDevelopment({ userId: emp3.id, trainingName: "React & TypeScript Bootcamp", startDate: "2025-01-06", endDate: "2025-03-28", completed: false });

  console.log("Database seeded successfully with sample data");
}
