import StatusChecker from "../components/StatusChecker.jsx";

export default function StatusCheck() {
  return (
    <div>
      <div className="page-header">
        <h1>Unit Status Check</h1>
        <p>
          Enter your unit number to see the current repair stage, overall
          progress, estimated completion date, and recent updates.
        </p>
      </div>
      <StatusChecker />
    </div>
  );
}
