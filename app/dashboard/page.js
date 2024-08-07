import GetLeagues from "@/components/GetLeagues";
import Header from "@/components/Header";
import JoinLeague from "@/components/JoinLeague";
import Link from "next/link";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8 flex flex-col gap-2 md:gap-6">
        <div>
          <div className="flex flex-1 justify-between items-center mt-16">
            <h1 className="text-3xl md:text-4xl font-extrabold ">
              My Dashboard
            </h1>
            <Link href={"/dashboard/create-league"}>
              <button className="btn btn-primary">Start a league</button>
            </Link>
          </div>
          <div className="flex flex-row mt-20 justify-between">
            <div role="tablist" className="tabs tabs-bordered">
              <input
                type="radio"
                name="my_tabs_1"
                role="tab"
                className="tab"
                aria-label="My Pools and Contests"
              />
              <div role="tabpanel" className="tab-content p-10">
                Tab content 1
                <GetLeagues />
              </div>

              <input
                type="radio"
                name="my_tabs_1"
                role="tab"
                className="tab"
                aria-label="Join a pool or contest"
                defaultChecked
              />
              <div role="tabpanel" className="tab-content p-10">
                Tab content 2
                <JoinLeague />
              </div>
            </div>
            <div className="flex flex-row gap-3">
              <p>Sort by date </p>

              <label className="input input-bordered flex items-center gap-2">
                <input type="text" className="grow" placeholder="Search" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </label>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
