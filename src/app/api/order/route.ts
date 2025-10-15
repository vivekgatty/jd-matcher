// src/app/api/order/route.ts
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node (not edge)

export async function POST() {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: 100, // paise → ₹1
      currency: "INR",
      receipt: `jd-${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "order_failed" }, { status: 500 });
  }
}
