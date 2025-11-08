

import { GoogleGenAI, Type } from '@google/genai';

let ai;

// This function ensures ai is initialized only once.
const getAI = () => {
    if (!ai) {
        // Vite uses import.meta.env for environment variables
        // Supports VITE_API_KEY, VITE_GEMINI_API_KEY, or GEMINI_API_KEY (if exposed via define)
        const apiKey = import.meta.env.VITE_API_KEY ||
            import.meta.env.VITE_GEMINI_API_KEY ||
            import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set. Please set VITE_API_KEY or VITE_GEMINI_API_KEY in your .env file.");
        }
        ai = new GoogleGenAI({ apiKey: apiKey });
    }
    return ai;
};


const tools = [
    {
        name: 'generate_study_flowchart',
        description: "Generates a 2-year or 4-year flowchart of courses. It creates a 2-year plan for an Associate degree at Miami Dade College (MDC). If a target university and bachelor's degree are provided, it extends the plan to a full 4-year timeline including the transfer path.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                career: { type: Type.STRING, description: 'The desired career path or major, e.g., "Software Engineering".' },
                startDate: { type: Type.STRING, description: 'The desired start date for studies, e.g., "Fall 2024".' },
                coursesPerTerm: { type: Type.STRING, description: 'The number of courses the student wants to take per term. e.g., "3", or "4 in fall, 2 in summer".' },
                targetUniversity: { type: Type.STRING, description: 'Optional. The university the student wants to transfer to for a Bachelor\'s degree, e.g., "Florida International University".' },
                bachelorsDegree: { type: Type.STRING, description: 'Optional. The specific Bachelor\'s degree, e.g., "Bachelor of Science in Computer Science".' },
            },
            required: ['career', 'startDate', 'coursesPerTerm'],
        },
    },
    {
        name: 'offer_pdf_export',
        description: "Presents the user with options to download content as a PDF or send it to an email. Use this when the user wants to save or share a summary.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: 'The text content to be included in the PDF.' },
            },
            required: ['content'],
        },
    },
    {
        name: 'analyze_career_potential',
        description: 'Analyzes a user\'s interests, skills, and optional resume to suggest and detail potential career paths. Use this for broad questions about what career to choose.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                interests: { type: Type.STRING, description: 'A description of the user\'s interests, hobbies, and passions.' },
                skills: { type: Type.STRING, description: 'A description of the user\'s skills, both hard and soft.' },
                resumeText: { type: Type.STRING, description: 'Optional. The full text of the user\'s resume for a more detailed analysis.' },
            },
            required: ['interests', 'skills'],
        },
    },
    {
        name: 'get_tuition_estimate',
        description: 'Estimates tuition costs for a specific career path at a given university. Defaults to Miami Dade College if no university is specified.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                career: { type: Type.STRING, description: 'The career path to estimate tuition for, e.g., "Nursing".' },
                university: { type: Type.STRING, description: 'Optional. The name of the university, e.g., "Florida International University". Defaults to "Miami Dade College".' },
            },
            required: ['career'],
        },
    },
    {
        name: 'get_course_summary',
        description: 'Provides a summary for a specific course within a career path. Uses Google Search to find details like prerequisites, topics covered, and difficulty.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                career: { type: Type.STRING, description: 'The career path the course belongs to, e.g., "Computer Science".' },
                courseName: { type: Type.STRING, description: 'The name of the course to summarize, e.g., "Data Structures and Algorithms".' },
            },
            required: ['career', 'courseName'],
        },
    },
    {
        name: 'get_teacher_reviews',
        description: 'Fetches reviews for a specific teacher at Miami Dade College from sources like Rate My Professor using Google Search.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                teacherName: { type: Type.STRING, description: 'The name of the teacher to look up.' },
                courseName: { type: Type.STRING, description: 'Optional. The name of the course the teacher teaches.' },
            },
            required: ['teacherName'],
        },
    },
    {
        name: 'find_teachers',
        description: 'Finds teachers at Miami Dade College based on specific criteria, such as the highest review score or most reviews. Can be filtered by course name.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                sortBy: { type: Type.STRING, description: 'The criteria to sort teachers by. e.g., "highest score", "most reviews".' },
                courseName: { type: Type.STRING, description: 'Optional. The name of the course to filter teachers by.' },
            },
            required: ['sortBy'],
        },
    },
    {
        name: 'get_transfer_options',
        description: 'Provides information about transfer programs from Miami Dade College (MDC) to another university for a specific major.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                major: { type: Type.STRING, description: 'The student\'s major, e.g., "Computer Science".' },
                targetUniversity: { type: Type.STRING, description: 'The university the student wants to transfer to, e.g., "Florida International University".' },
            },
            required: ['major', 'targetUniversity'],
        },
    }
];

export const initializeChat = async () => {
    const ai = getAI();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a friendly and knowledgeable AI career advisor for students, with a focus on Miami Dade College (MDC). Your goal is to provide helpful, accurate, and up-to-date information. For users who are unsure where to start, you can offer to perform a detailed career potential analysis based on their interests and skills. When a user asks for information that could be time-sensitive or requires real-world data (like tuition, reviews, transfer options), use your available tools. Teacher reviews, tuition estimates, and transfer options should be specific to MDC. For transfer options, assume the student is completing an Associate in Arts (AA) at MDC. If a tool requires more information (like an email for a PDF or a start date for a study plan), ask the user for it before calling the tool. Be encouraging and clear in your responses.",
            tools: [{ functionDeclarations: tools }],
        }
    });
    return chat;
};

// FIX: Corrected chat.sendMessage call and refactored function call extraction.
export const sendMessageToAI = async (chat, message, toolResponse) => {
    let result;
    let content;

    if (toolResponse) {
        content = [
            {
                functionResponse: {
                    id: toolResponse.id,
                    name: toolResponse.name,
                    response: toolResponse.response,
                },
            },
        ];
    } else {
        content = [{ text: message }];
    }

    result = await chat.sendMessage({ message: content });

    // Extract function calls first
    const functionCalls = result.functionCalls?.map(fc => ({
        id: fc.id || '',
        name: fc.name,
        args: fc.args,
    }));

    // Extract text from response parts, handling cases where function calls are present
    // Avoid accessing result.text directly when function calls exist to prevent SDK warnings
    let text = '';
    if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.content && candidate.content.parts) {
            // Extract only text parts, ignoring function call parts
            const textParts = candidate.content.parts
                .filter(part => part.text && !part.functionCall)
                .map(part => part.text);
            text = textParts.join(' ').trim();
        }
    }

    // Only fallback to result.text if no function calls are present (to avoid SDK warning)
    // Check functionCalls length to avoid triggering SDK warning
    if (!text && (!functionCalls || functionCalls.length === 0)) {
        try {
            // Only access result.text if we know there are no function calls
            if (result.text) {
                text = result.text.trim();
            }
        } catch (e) {
            // Ignore any errors from accessing text property
            console.debug('Could not extract text from result:', e);
        }
    }

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, functionCalls, groundingChunks };
};

export const getFlowchartData = async (career, startDate, coursesPerTerm, targetUniversity, bachelorsDegree) => {
    const ai = getAI();
    let prompt;

    if (targetUniversity && bachelorsDegree) {
        prompt = `Generate a comprehensive 4-year study plan for a student pursuing a career in ${career}. The plan should start with a 2-year Associate degree at Miami Dade College (MDC), beginning in ${startDate}, and then transfer to ${targetUniversity} to complete a ${bachelorsDegree}. Use Google Search to find the official MDC curriculum and the curriculum for the Bachelor's degree at ${targetUniversity}, including transfer requirements and articulation agreements like the 2+2 pathway. The student wants to take courses based on this schedule: "${coursesPerTerm}". Structure the plan to match this course load for all 4 years.

The output must be a single JSON object. The root object should have two keys: "career" (string, value: "${career}") and "plans" (an array of two degree plan objects).

The first degree plan object (for MDC) must have three keys:
1. "institution" (string, value: "Miami Dade College")
2. "degree" (string, e.g., "Associate in Arts - ${career}")
3. "timeline" (an array of term objects for the first two years).

The second degree plan object (for ${targetUniversity}) must have three keys:
1. "institution" (string, value: "${targetUniversity}")
2. "degree" (string, value: "${bachelorsDegree}")
3. "timeline" (an array of term objects for the final two years).

Each term object in both timelines must have two keys: "term" (string, e.g., "Fall 2024") and "courses" (an array of strings, where each string includes both the course code and name, e.g., ["COP 1000 - Introduction to Programming"]).

Do not include any explanatory text, just the raw JSON.`;
    } else {
        prompt = `Generate a detailed 2-year Associate degree study plan for a student at Miami Dade College (MDC) pursuing a career in ${career}, starting in ${startDate}. Use Google Search to find the official MDC curriculum for this pathway. The student wants to take courses based on this schedule: "${coursesPerTerm}". Structure the plan to match this course load.

The output must be a single JSON object. The root object should have two keys: "career" (string, e.g., "${career}") and "plans" (an array containing one degree plan object).

The degree plan object must have three keys:
1. "institution" (string, value: "Miami Dade College")
2. "degree" (string, e.g., "Associate in Arts - ${career}")
3. "timeline" (an array of term objects).

Each term object in the timeline must have two keys: "term" (string, e.g., "Fall 2024") and "courses" (an array of strings, where each string includes both the course code and name, e.g., ["COP 1000 - Introduction to Programming"]).

Do not include any explanatory text, just the raw JSON.`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    try {
        let jsonText = response.text;

        // The model might wrap the JSON in markdown backticks or return it with other text.
        // Let's extract the JSON part.
        const jsonMatch = jsonText.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            jsonText = jsonMatch[2];
        } else {
            // Fallback for when it's not in a markdown block but might be surrounded by text
            const startIndex = jsonText.indexOf('{');
            const endIndex = jsonText.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                jsonText = jsonText.substring(startIndex, endIndex + 1);
            }
        }

        const data = JSON.parse(jsonText);
        // Basic validation
        if (data.career && Array.isArray(data.plans)) {
            return data;
        } else {
            throw new Error("Invalid JSON structure received from AI for flowchart.");
        }
    } catch (e) {
        console.error("Failed to parse flowchart JSON:", e, "Raw text:", response.text);
        throw new Error("Could not generate a valid study plan. The AI returned an unexpected format.");
    }
};

export const analyzeCareerPotential = async (interests, skills, resumeText) => {
    const ai = getAI();
    let prompt = `Act as an expert career counselor. A student from Miami Dade College is seeking guidance. Analyze the following profile and provide a detailed career analysis.

    **Student's Interests:** ${interests}
    **Student's Skills:** ${skills}
    `

    if (resumeText) {
        prompt += `\n**Student's Resume:**\n${resumeText}\n`
    }

    prompt += `
    Based on this profile, suggest 3 to 5 highly relevant career paths. For each path, provide:
    1.  **Career Title:** (e.g., "Data Scientist")
    2.  **Why it's a good fit:** A brief explanation connecting their interests and skills to this career.
    3.  **Potential Starting Roles:** List 2-3 entry-level job titles.
    4.  **Key Skills to Develop:** Suggest 3-4 important skills they should focus on acquiring.
    5.  **Educational Path at MDC:** Recommend a relevant Associate's degree at Miami Dade College and mention potential transfer pathways for a Bachelor's degree.

    Format your response using clear headings and bullet points in Markdown. Be encouraging and provide actionable advice.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });

    return response.text;
};

export const getTuitionEstimate = async (career, university) => {
    const ai = getAI();
    const targetUniversity = university || "Miami Dade College";
    const degreeType = targetUniversity === "Miami Dade College" ? "an Associate's degree" : "a Bachelor's degree";

    let prompt = `As a career advisor, provide a detailed estimate of tuition costs for a student pursuing ${degreeType} for a "${career}" career path at ${targetUniversity}.`;
    prompt += ` Use Google Search to find the most current and relevant information from the official ${targetUniversity} website. Break down the costs if possible (e.g., in-state vs. out-of-state, per credit hour, fees). Present the information clearly. If you find web sources, mention them.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let resultText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map(chunk => chunk.web && chunk.web.uri ? `[${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
            .filter(Boolean);
        if (sources.length > 0) {
            resultText += "\n\n**Sources:**\n- " + sources.join('\n- ');
        }
    }

    return resultText;
};


export const getCourseSummary = async (career, courseName) => {
    const ai = getAI();
    const prompt = `Provide a detailed summary for the course "${courseName}" in the context of a "${career}" degree. Use Google Search to find information on prerequisites, main topics covered, typical difficulty, and what students will learn. Present the information in a clear, structured format. If you find web sources, mention them.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let resultText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map(chunk => chunk.web && chunk.web.uri ? `[${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
            .filter(Boolean);
        if (sources.length > 0) {
            resultText += "\n\n**Sources:**\n- " + sources.join('\n- ');
        }
    }

    return resultText;
};

export const getTeacherReviews = async (teacherName, courseName) => {
    const ai = getAI();
    let prompt = `Using Google Search, find reviews for professor "${teacherName}" from "Miami Dade College".`;
    if (courseName) {
        prompt += ` Specifically in relation to the course "${courseName}".`;
    }
    prompt += ` Summarize the reviews found on websites like Rate My Professor. Focus on teaching style, overall quality, difficulty, and common student comments. If available, include their rating. Present the information clearly.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let resultText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map(chunk => chunk.web && chunk.web.uri ? `[${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
            .filter(Boolean);
        if (sources.length > 0) {
            resultText += "\n\n**Sources:**\n- " + sources.join('\n- ');
        }
    }

    return resultText;
};

export const findTeachers = async (sortBy, courseName) => {
    const ai = getAI();
    let prompt = `Using Google Search, find professors at "Miami Dade College" with the ${sortBy}.`;
    if (courseName) {
        prompt += ` for the course "${courseName}".`;
    }
    prompt += ` List the top 3-5 teachers found on sites like Rate My Professor, including their rating and a brief summary of their reviews. Format the response as a clear, easy-to-read list.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let resultText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map(chunk => chunk.web && chunk.web.uri ? `[${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
            .filter(Boolean);
        if (sources.length > 0) {
            resultText += "\n\n**Sources:**\n- " + sources.join('\n- ');
        }
    }

    return resultText;
};

export const getTransferOptions = async (major, targetUniversity) => {
    const ai = getAI();
    const prompt = `Provide detailed information about the transfer options and agreements between Miami Dade College (MDC) and ${targetUniversity} for a student with an Associate in Arts degree majoring in ${major}. Use Google Search to find official information from both MDC and ${targetUniversity} websites. Include details on articulation agreements, required GPA, and any specific prerequisite courses. Present the information clearly.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    let resultText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map(chunk => chunk.web && chunk.web.uri ? `[${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
            .filter(Boolean);
        if (sources.length > 0) {
            resultText += "\n\n**Sources:**\n- " + sources.join('\n- ');
        }
    }

    return resultText;
};