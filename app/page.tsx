import { ExpenseTracker } from "@/components/expense-tracker";

export default function Home() {
  return (
    <div className="relative w-full">
      <div className="z-[20] relative ">
        <ExpenseTracker />
      </div>
      <div
        style={{
          borderRadius: "57% 25% 50% 50% / 0% 0% 10% 10%",
        }}
        className="h-[300px] z-[10] absolute top-0 w-full block shadow-xl bg-gradient-to-tr from-teal-500 to-violet-500"
      ></div>
    </div>
  );
}
