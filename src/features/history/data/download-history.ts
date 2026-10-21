export type DownloadHistoryEntry = {
  id: string;
  reportName: string;
  downloadedAt: string;
  user: string;
};

const reportNames = [
  "Resilience Report",
  "Parameter Summary",
  "ITRI Trend Report",
  "Resilience Report",
  "Control Assessment",
];
const users = ["Abhignya Bhat", "Rahul Nair", "Priya Sharma", "Karan Mehta", "Meera Iyer"];
const anchorDate = Date.UTC(2026, 9, 16, 5, 15);

// Front-end fixture: 42 report downloads spread across the last six weeks.
export const downloadHistory: DownloadHistoryEntry[] = Array.from({ length: 42 }, (_, index) => ({
  id: `download-${index + 1}`,
  reportName: reportNames[index % reportNames.length],
  downloadedAt: new Date(anchorDate - index * 24 * 60 * 60 * 1000).toISOString(),
  user: users[index % users.length],
}));
