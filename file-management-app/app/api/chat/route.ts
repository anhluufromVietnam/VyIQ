import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { projectId, message, context } = await request.json()

    // TODO: Replace this with your actual LLM backend API call
    // Example structure for your HTTP backend integration:

    const response = await fetch("YOUR_LLM_BACKEND_URL/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`, // If needed
      },
      body: JSON.stringify({
        project_id: projectId,
        user_message: message,
        context: {
          project_name: context.projectName,
          previous_messages: context.previousMessages,
        },
      }),
    })

    if (!response.ok) {
      throw new Error("LLM backend request failed")
    }

    const data = await response.json()

    return NextResponse.json({
      response:
        data.response ||
        data.message ||
        "I understand your question about the project. Could you provide more specific details about what you'd like to discuss?",
    })
  } catch (error) {
    console.error("Chat API error:", error)

    // Fallback response for development/demo
    return NextResponse.json({
      response:
        "I'm here to help discuss your project! While the backend connection isn't available right now, I'd be happy to help you analyze the content, discuss key themes, or provide insights about your presentation. What specific aspect would you like to explore?",
    })
  }
}
