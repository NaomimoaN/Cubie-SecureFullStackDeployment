import React, { useState, useEffect } from "react";
import useAuth from "../../../hooks/useAuth";
import { getStudentBadges } from "../../../services/badgeService";

function StudentBadgeDisplay() {
  const { user } = useAuth();
  const [badges, setBadges] = useState({
    yellow: false,
    blue: false,
    pink: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.userId) {
      checkBadgeEligibility();
    }
  }, [user]);

  const checkBadgeEligibility = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentId = user.userId;

      // サーバーサイドでAcademicWeekシステムを使用してバッジを取得
      const response = await getStudentBadges(studentId);

      if (response.success) {
        setBadges(response.data);
      } else {
        setError("Failed to get badge information.");
      }
    } catch (error) {
      console.error("Badge check error:", error);
      setError("Failed to get badge information.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading badge information...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="flex justify-center items-center p-4">
      <div className="flex gap-4">
        {/* Yellow Badge */}
        <div
          className={`relative ${badges.yellow ? "opacity-100" : "opacity-30"}`}
        >
          <img
            src="/badges/Yellow_badge.svg"
            alt="Yellow Badge"
            className="w-16 h-16"
          />
        </div>

        {/* Blue Badge */}
        <div
          className={`relative ${badges.blue ? "opacity-100" : "opacity-30"}`}
        >
          <img
            src="/badges/Blue_badge.svg"
            alt="Blue Badge"
            className="w-16 h-16"
          />
        </div>

        {/* Pink Badge */}
        <div
          className={`relative ${badges.pink ? "opacity-100" : "opacity-30"}`}
        >
          <img
            src="/badges/Pink_badge.svg"
            alt="Pink Badge"
            className="w-16 h-16"
          />
        </div>
      </div>
    </div>
  );
}

export default StudentBadgeDisplay;
