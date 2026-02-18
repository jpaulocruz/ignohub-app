-- Add UPDATE policy for organizations
-- Allows users to update organizations they are members of (e.g., admins/owners)
-- Ideally we should check for role 'owner' or 'admin', but for now mirroring the SELECT policy

create policy "Users can update their organizations"
on organizations
for update
using (
  check_org_membership(id)
)
with check (
  check_org_membership(id)
);
