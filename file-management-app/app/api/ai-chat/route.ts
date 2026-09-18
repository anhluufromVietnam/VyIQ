import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { projectId, message, context } = await request.json()

    // TODO: Replace this with your actual trained LLM API call
    // This is where you would call your custom trained model

    const response = await fetch("YOUR_TRAINED_LLM_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model_id: `project_${projectId}_model`, // Your trained model ID
        prompt: message,
        context: {
          project_name: context.projectName,
          current_slide: context.currentSlide,
          conversation_history: context.previousMessages,
        },
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error("LLM API request failed")
    }

    const data = await response.json()

    return NextResponse.json({
      response:
        data.response ||
        data.text ||
        "Tôi xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Bạn có thể thử hỏi cách khác không?",
    })
  } catch (error) {
    console.error("AI Chat API error:", error)

    // Fallback response for development
    return NextResponse.json({
      response:
        "Tôi hiểu câu hỏi của bạn về dự án. Mặc dù kết nối với mô hình AI gặp sự cố, tôi có thể chia sẻ rằng dự án này có tiềm năng lớn và cần được triển khai cẩn thận. Bạn có muốn thảo luận về khía cạnh cụ thể nào không?",
    })
  }
}
