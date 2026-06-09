import { listUsers } from "@/data"
import { CreateUserForm } from "./create-user-form"
import { DeleteUserButton } from "./delete-user-button"

export default async function Page() {
  const users = await listUsers()

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex w-full max-w-md min-w-0 flex-col gap-6">
        <div>
          <h1 className="text-lg font-medium">Users</h1>
          <p className="text-sm text-muted-foreground">
            Create and delete users stored in SQLite.
          </p>
        </div>

        <CreateUserForm />

        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium">
                  {user.name}
                </span>
                <DeleteUserButton id={user.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
