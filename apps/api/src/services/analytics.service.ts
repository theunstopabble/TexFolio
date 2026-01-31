import { Resume } from "../models/index.js";

export const analyticsService = {
  async getStats(userId: string) {
    // 1. Total Resumes
    const totalResumes = await Resume.countDocuments({ userId });

    // 2. Resumes Created Per Month (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Resume.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format monthly stats for frontend
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const chartData = monthlyStats.map((item) => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      resumes: item.count,
    }));

    // 3. Top Skills
    const topSkills = await Resume.aggregate([
      { $match: { userId } },
      { $unwind: "$skills" }, // Flatten the skill categories
      { $unwind: "$skills.skills" }, // Flatten the skills array within categories
      {
        $group: {
          _id: "$skills.skills",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 4. Average ATS Score (if available)
    const atsStats = await Resume.aggregate([
      { $match: { userId, atsScore: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$atsScore" },
        },
      },
    ]);

    return {
      totalResumes,
      chartData,
      topSkills: topSkills.map((s) => ({ name: s._id, count: s.count })),
      avgAtsScore: atsStats[0]?.avgScore ? Math.round(atsStats[0].avgScore) : 0,
    };
  },
};
