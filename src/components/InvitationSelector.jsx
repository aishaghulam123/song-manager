import { INVITATIONS } from "../config/invitations";

export default function InvitationSelector({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="invitation" className="text-sm font-medium text-foreground">
        Select Invitation
      </label>
      <select
        id="invitation"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select invitation</option>
        {INVITATIONS.map((invitation) => (
          <option key={invitation.id} value={invitation.id}>
            {invitation.name}
          </option>
        ))}
      </select>
    </div>
  );
}
