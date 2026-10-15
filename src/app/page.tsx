import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Unstack Learning</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Personal learning support — this site is just getting started, and help
        requests, queueing, and sessions are not available yet.
      </p>
      {user ? (
        <p className="text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {user.firstName || user.emailAddresses[0]?.emailAddress}
          </span>
          .
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to get started.</p>
      )}
    </div>
  );
}
