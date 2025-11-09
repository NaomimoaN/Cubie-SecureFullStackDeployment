import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AverageScoreBySubjectChart from "../components/parent/analytics/AverageScoreBySubjectChart.jsx";

const AverageScoreBySubjectPage = () => {
  const { user, loading } = useAuth();

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ログインしていない場合はログインページにリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // parentロールでない場合はアクセス拒否
  if (user.role !== "parent") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            This page is only accessible to parents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Term-by-Subject Average Score Analysis
          </h1>
          <p className="mt-2 text-gray-600">
            Child's average score by subject in each term.
          </p>
        </div>

        <AverageScoreBySubjectChart />
      </div>
    </div>
  );
};

export default AverageScoreBySubjectPage;
