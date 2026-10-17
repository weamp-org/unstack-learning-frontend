import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Unstack Learning</h1>
      <p className="text-xl font-medium">Get unstuck. Keep learning.</p>
      <p className="max-w-xl text-lg text-muted-foreground">
        Free academic help — work through difficult concepts and questions with
        someone who can explain, so you can continue learning independently.
        Requesting help isn&apos;t available yet; we&apos;re building the core
        experience now.
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
        <p className="text-sm text-muted-foreground">
          Sign in to be ready when help requests open.
        </p>
      )}
    </div>
  );
}
