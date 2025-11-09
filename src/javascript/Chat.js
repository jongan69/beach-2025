import { initializeChat, sendMessageToAI, getDegreeCost, searchCollegeArticulationDocs } from '../services/gemini.js'
import elevenLabsService from '../services/eleven.js'

export default class Chat
{
    constructor()
    {
        // DOM elements
        this.$widget = document.querySelector('.js-chat-widget')
        this.$toggle = document.querySelector('.js-chat-toggle')
        this.$close = document.querySelector('.js-chat-close')
        this.$messages = document.querySelector('.js-chat-messages')
        this.$input = document.querySelector('.js-chat-input')
        this.$send = document.querySelector('.js-chat-send')

        // Check if elements exist
        if (!this.$widget || !this.$toggle || !this.$close || !this.$messages || !this.$input || !this.$send) {
            console.error('Chat: Some DOM elements are missing', {
                widget: !!this.$widget,
                toggle: !!this.$toggle,
                close: !!this.$close,
                messages: !!this.$messages,
                input: !!this.$input,
                send: !!this.$send
            })
            console.error('Chat: Available DOM elements:', {
                body: !!document.body,
                widget: document.querySelector('.js-chat-widget'),
                toggle: document.querySelector('.js-chat-toggle')
            })
            // Don't return - allow partial initialization so instance exists
            // This allows retry logic to work
            this.initialized = false
            return
        }

        console.log('Chat: All elements found, initializing...')

        // State
        this.chat = null
        this.isOpen = false
        this.isLoading = false
        this.initialized = true

        // Initialize
        this.setToggle()
        this.setClose()
        this.setSend()
        this.setInput()
        this.initializeAI()
        
        console.log('Chat: Initialization complete')
    }

    async initializeAI()
    {
        try
        {
            this.chat = await initializeChat()
        }
        catch(error)
        {
            console.error('Failed to initialize AI chat:', error)
            this.addMessage('bot', 'Sorry, I\'m having trouble connecting right now. Please check your API key configuration.')
        }
    }

    setToggle()
    {
        if (!this.$toggle) return
        
        this.$toggle.addEventListener('click', (e) =>
        {
            e.preventDefault()
            e.stopPropagation()
            console.log('Toggle clicked')
            this.toggle()
        })
    }

    setClose()
    {
        if (!this.$close) return
        
        this.$close.addEventListener('click', (e) =>
        {
            e.stopPropagation()
            this.close()
        })
    }

    setSend()
    {
        if (!this.$send) return
        
        this.$send.addEventListener('click', (e) =>
        {
            e.stopPropagation()
            this.sendMessage()
        })
    }

    setInput()
    {
        if (!this.$input) return
        
        // Handle Enter key to send message
        this.$input.addEventListener('keypress', (e) =>
        {
            if(e.key === 'Enter' && !e.shiftKey)
            {
                e.preventDefault()
                e.stopPropagation()
                this.sendMessage()
            }
        })
        
        // Stop propagation of arrow keys and WASD when input is focused
        // This prevents driving controls from interfering with typing
        this.$input.addEventListener('keydown', (e) =>
        {
            // Allow Escape key to blur input and return to driving controls
            if(e.key === 'Escape')
            {
                this.$input.blur()
                e.stopPropagation()
                return
            }
            
            // Stop arrow keys, WASD, Space, Shift, Ctrl from propagating when typing
            const controlKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                                'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 
                                'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']
            if(controlKeys.includes(e.code))
            {
                e.stopPropagation()
            }
        })
        
        // When input loses focus, controls work normally again
        this.$input.addEventListener('blur', () =>
        {
            // Controls should work normally now
        })
    }

    toggle()
    {
        if(this.isOpen)
        {
            this.close()
        }
        else
        {
            this.open()
        }
    }

    open()
    {
        if (!this.$widget || !this.$toggle) return
        
        this.isOpen = true
        this.$widget.classList.add('is-active')
        this.$toggle.style.display = 'none'
        
        // Don't auto-focus the input to allow driving controls to work
        // User can click on input when they want to type
        console.log('Chat opened')
    }

    close()
    {
        if (!this.$widget || !this.$toggle) return
        
        this.isOpen = false
        this.$widget.classList.remove('is-active')
        this.$toggle.style.display = 'flex'
        console.log('Chat closed')
    }

    /**
     * Open chat with a pre-filled message for a specific career
     * This is called when user interacts with a career area
     */
    async openWithCareer(careerName, careerId)
    {
        // Check if chat was properly initialized
        if (!this.initialized) {
            console.error('Chat: Not properly initialized, attempting to reinitialize...')
            // Try to reinitialize
            const elements = {
                widget: document.querySelector('.js-chat-widget'),
                toggle: document.querySelector('.js-chat-toggle'),
                close: document.querySelector('.js-chat-close'),
                messages: document.querySelector('.js-chat-messages'),
                input: document.querySelector('.js-chat-input'),
                send: document.querySelector('.js-chat-send')
            }
            
            if (elements.widget && elements.toggle && elements.close && elements.messages && elements.input && elements.send) {
                this.$widget = elements.widget
                this.$toggle = elements.toggle
                this.$close = elements.close
                this.$messages = elements.messages
                this.$input = elements.input
                this.$send = elements.send
                this.initialized = true
                this.setToggle()
                this.setClose()
                this.setSend()
                this.setInput()
                await this.initializeAI()
            } else {
                console.error('Chat: Cannot reinitialize - DOM elements still missing')
                return
            }
        }
        
        // Open the chat first
        this.open()
        
        // Wait a moment for the chat to open and ensure AI is initialized
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Ensure AI is initialized
        if (!this.chat) {
            await this.initializeAI()
        }
        
        // Create a comprehensive prompt for generating a course plan
        // The prompt explicitly asks for PDF generation
        const prompt = `I'm interested in pursuing a career in ${careerName} at Miami Dade College. Please generate a complete 2-year Associate degree study plan starting in Fall 2025. I'd like to take 4 courses per term. After generating the plan, please offer to create a PDF document of the complete course plan.`
        
        // Pre-fill the input with the prompt (for user visibility)
        if (this.$input) {
            this.$input.value = prompt
        }
        
        // Automatically send the message after a short delay
        setTimeout(() => {
            // Use the prompt directly instead of reading from input
            console.log('Chat: Sending prefilled message:', prompt)
            this.sendPrefilledMessage(prompt)
        }, 400)
    }

    /**
     * Send a pre-filled message (used when opening with career context)
     */
    async sendPrefilledMessage(message)
    {
        console.log('Chat: sendPrefilledMessage called', { message, isLoading: this.isLoading, hasChat: !!this.chat })
        
        if(!message || this.isLoading)
        {
            console.log('Chat: Skipping send - no message or already loading')
            return
        }

        if(!this.chat)
        {
            console.log('Chat: Initializing AI...')
            this.addMessage('bot', 'Please wait while I initialize...')
            await this.initializeAI()
            if(!this.chat)
            {
                console.error('Chat: Failed to initialize AI')
                this.setLoading(false)
                return
            }
        }

        // Add user message to UI
        this.addMessage('user', message)
        this.setLoading(true)
        console.log('Chat: Loading state set to true, sending message to AI...')

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (this.isLoading) {
                console.error('Request timeout - clearing loading state')
                this.setLoading(false)
                this.addMessage('bot', 'Sorry, the request is taking too long. Please try again.')
            }
        }, 60000) // 60 second timeout

        try
        {
            console.log('Chat: Calling sendMessageToAI...')
            // Send message to AI
            const response = await sendMessageToAI(this.chat, message)
            console.log('Chat: Received response from AI', { 
                hasText: !!response.text, 
                hasFunctionCalls: !!(response.functionCalls && response.functionCalls.length > 0),
                functionCallCount: response.functionCalls?.length || 0
            })

            // Clear timeout since we got a response
            clearTimeout(timeoutId)

            // Handle function calls if any
            if(response.functionCalls && response.functionCalls.length > 0)
            {
                console.log('Chat: Handling function calls...', response.functionCalls.length)
                await this.handleFunctionCalls(response.functionCalls)
                console.log('Chat: Function calls handled')
            }
            else
            {
                // Display AI response
                if(response.text)
                {
                    console.log('Chat: Adding bot message:', response.text.substring(0, 100))
                    this.addMessage('bot', response.text)
                }
                else
                {
                    console.warn('Chat: No text or function calls in response')
                    this.addMessage('bot', 'I received your message but didn\'t get a response. Please try again.')
                }
            }
        }
        catch(error)
        {
            clearTimeout(timeoutId)
            console.error('Chat: Error sending message:', error)
            this.addMessage('bot', 'Sorry, I encountered an error. Please try again.')
        }
        finally
        {
            // Always clear loading state
            console.log('Chat: Clearing loading state')
            this.setLoading(false)
        }
    }

    async sendMessage()
    {
        const message = this.$input.value.trim()
        
        if(!message || this.isLoading)
        {
            return
        }

        if(!this.chat)
        {
            this.addMessage('bot', 'Please wait while I initialize...')
            await this.initializeAI()
            if(!this.chat)
            {
                return
            }
        }

        // Add user message to UI
        this.addMessage('user', message)
        this.$input.value = ''
        this.setLoading(true)

        try
        {
            // Send message to AI
            const response = await sendMessageToAI(this.chat, message)

            // Handle function calls if any
            if(response.functionCalls && response.functionCalls.length > 0)
            {
                await this.handleFunctionCalls(response.functionCalls)
            }
            else
            {
                // Display AI response
                if(response.text)
                {
                    this.addMessage('bot', response.text)
                }
            }
        }
        catch(error)
        {
            console.error('Error sending message:', error)
            this.addMessage('bot', 'Sorry, I encountered an error. Please try again.')
        }
        finally
        {
            this.setLoading(false)
        }
    }

    async handleFunctionCalls(functionCalls, depth = 0)
    {
        // Limit recursion depth to prevent infinite loops
        const MAX_DEPTH = 5
        if (depth > MAX_DEPTH) {
            console.error('Maximum function call depth reached')
            this.addMessage('bot', 'Sorry, I encountered too many nested function calls. Please try again.')
            return
        }

        // Process function calls sequentially
        for(const functionCall of functionCalls)
        {
            let toolResponse = null

            try
            {
                switch(functionCall.name)
                {
                    case 'generate_study_flowchart':
                        toolResponse = await this.handleGenerateFlowchart(functionCall)
                        break
                    case 'analyze_career_potential':
                        toolResponse = await this.handleAnalyzeCareer(functionCall)
                        break
                    case 'get_tuition_estimate':
                        toolResponse = await this.handleGetTuition(functionCall)
                        break
                    case 'get_course_summary':
                        toolResponse = await this.handleGetCourseSummary(functionCall)
                        break
                    case 'get_teacher_reviews':
                        toolResponse = await this.handleGetTeacherReviews(functionCall)
                        break
                    case 'find_teachers':
                        toolResponse = await this.handleFindTeachers(functionCall)
                        break
                    case 'get_transfer_options':
                        toolResponse = await this.handleGetTransferOptions(functionCall)
                        break
                    case 'offer_pdf_export':
                        toolResponse = await this.handleOfferPDFExport(functionCall)
                        break
                    case 'calculate_degree_cost':
                        toolResponse = await this.handleCalculateDegreeCost(functionCall)
                        break
                    case 'search_college_articulation_docs':
                        toolResponse = await this.handleSearchArticulationDocs(functionCall)
                        break
                    default:
                        toolResponse = {
                            id: functionCall.id,
                            name: functionCall.name,
                            response: { error: 'Unknown function call' }
                        }
                }

                // Send tool response back to AI
                if(toolResponse)
                {
                    const aiResponse = await sendMessageToAI(this.chat, '', toolResponse)
                    
                    // Handle nested function calls (but limit recursion)
                    if(aiResponse.functionCalls && aiResponse.functionCalls.length > 0)
                    {
                        // Recursively handle function calls with increased depth
                        await this.handleFunctionCalls(aiResponse.functionCalls, depth + 1)
                    }
                    else if(aiResponse.text)
                    {
                        // Display AI response only if no more function calls
                        this.addMessage('bot', aiResponse.text)
                        
                        // If this was a generate_study_flowchart response, read it aloud
                        if (functionCall.name === 'generate_study_flowchart' && toolResponse.response?.success) {
                            this.speakCareerPlan(aiResponse.text, functionCall.args?.career)
                        }
                    }
                    else
                    {
                        // If no text and no function calls, show a default message
                        console.warn('Chat: No response text after function call')
                        this.addMessage('bot', 'I processed your request. Is there anything else you\'d like to know?')
                    }
                }
                else
                {
                    // If toolResponse is null, show an error message
                    console.error('Chat: toolResponse is null for function call:', functionCall.name)
                    this.addMessage('bot', `Sorry, I encountered an issue processing ${functionCall.name}. Please try again.`)
                }
            }
            catch(error)
            {
                console.error(`Error handling function call ${functionCall.name}:`, error)
                
                // Show error message to user immediately
                const errorMessage = error.message || 'An error occurred'
                if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
                    this.addMessage('bot', 'Sorry, the service is temporarily unavailable. Please try again in a moment.')
                } else {
                    this.addMessage('bot', `Sorry, I encountered an error while processing ${functionCall.name}: ${errorMessage}`)
                }
                
                const errorResponse = {
                    id: functionCall.id,
                    name: functionCall.name,
                    response: { error: errorMessage }
                }
                try {
                    const aiResponse = await sendMessageToAI(this.chat, '', errorResponse)
                    if(aiResponse.text)
                    {
                        // Only add if it's different from what we already showed
                        if (!aiResponse.text.includes(errorMessage)) {
                            this.addMessage('bot', aiResponse.text)
                        }
                    }
                } catch (sendError) {
                    console.error('Error sending error response:', sendError)
                    // Error message already shown above
                }
            }
        }
    }

    async handleGenerateFlowchart(functionCall)
    {
        const { getFlowchartData } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            console.log('Chat: Generating flowchart with args:', args)
            const flowchartData = await getFlowchartData(
                args.career,
                args.startDate,
                args.coursesPerTerm,
                args.targetUniversity,
                args.bachelorsDegree
            )

            // Determine degree level and years based on the plan
            const isAssociateOnly = !args.targetUniversity
            const degreeLevel = isAssociateOnly ? 'Associate' : 'Bachelor'
            const years = isAssociateOnly ? '2' : '4'
            
            // Get cost information for Miami Dade College (first institution in the plan)
            let costInfo = null
            try {
                const costParams = {
                    university: 'Miami Dade College',
                    degree: isAssociateOnly ? 'Associate' : undefined,
                    years: isAssociateOnly ? '2' : undefined,
                    adjustInflation: false
                }
                costInfo = await getDegreeCost(costParams)
                console.log('Chat: Retrieved cost information for Miami Dade College')
            } catch (costError) {
                console.warn('Chat: Failed to retrieve cost information:', costError)
                // Don't fail the whole operation if cost fetch fails
            }

            // Build the response message
            let message = `I've generated a ${args.targetUniversity ? '4-year' : '2-year'} study plan for ${args.career}. The plan includes ${flowchartData.plans.length} degree plan(s) with detailed course timelines.`
            
            if (costInfo) {
                message += `\n\n${costInfo}`
            }

            return {
                id: functionCall.id,
                name: 'generate_study_flowchart',
                response: {
                    success: true,
                    data: flowchartData,
                    costInfo: costInfo,
                    message: message
                }
            }
        }
        catch(error)
        {
            console.error('Chat: Error generating flowchart:', error)
            // Re-throw the error so it can be handled by the caller
            throw error
        }
    }

    async handleAnalyzeCareer(functionCall)
    {
        const { analyzeCareerPotential } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const analysis = await analyzeCareerPotential(
                args.interests,
                args.skills,
                args.resumeText
            )

            return {
                id: functionCall.id,
                name: 'analyze_career_potential',
                response: {
                    success: true,
                    analysis: analysis
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'analyze_career_potential',
                response: {
                    success: false,
                    error: error.message || 'Failed to analyze career potential'
                }
            }
        }
    }

    async handleGetTuition(functionCall)
    {
        const { getTuitionEstimate } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const estimate = await getTuitionEstimate(args.career, args.university)

            return {
                id: functionCall.id,
                name: 'get_tuition_estimate',
                response: {
                    success: true,
                    estimate: estimate
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'get_tuition_estimate',
                response: {
                    success: false,
                    error: error.message || 'Failed to get tuition estimate'
                }
            }
        }
    }

    async handleGetCourseSummary(functionCall)
    {
        const { getCourseSummary } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const summary = await getCourseSummary(args.career, args.courseName)

            return {
                id: functionCall.id,
                name: 'get_course_summary',
                response: {
                    success: true,
                    summary: summary
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'get_course_summary',
                response: {
                    success: false,
                    error: error.message || 'Failed to get course summary'
                }
            }
        }
    }

    async handleGetTeacherReviews(functionCall)
    {
        const { getTeacherReviews } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const reviews = await getTeacherReviews(args.teacherName, args.courseName)

            return {
                id: functionCall.id,
                name: 'get_teacher_reviews',
                response: {
                    success: true,
                    reviews: reviews
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'get_teacher_reviews',
                response: {
                    success: false,
                    error: error.message || 'Failed to get teacher reviews'
                }
            }
        }
    }

    async handleFindTeachers(functionCall)
    {
        const { findTeachers } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const teachers = await findTeachers(args.sortBy, args.courseName)

            return {
                id: functionCall.id,
                name: 'find_teachers',
                response: {
                    success: true,
                    teachers: teachers
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'find_teachers',
                response: {
                    success: false,
                    error: error.message || 'Failed to find teachers'
                }
            }
        }
    }

    async handleGetTransferOptions(functionCall)
    {
        const { getTransferOptions } = await import('../services/gemini.js')
        const args = functionCall.args
        
        try
        {
            const options = await getTransferOptions(args.major, args.targetUniversity)

            return {
                id: functionCall.id,
                name: 'get_transfer_options',
                response: {
                    success: true,
                    options: options
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'get_transfer_options',
                response: {
                    success: false,
                    error: error.message || 'Failed to get transfer options'
                }
            }
        }
    }

    async handleOfferPDFExport(functionCall)
    {
        // For now, just acknowledge the request
        // In a full implementation, you'd trigger PDF generation/download
        return {
            id: functionCall.id,
            name: 'offer_pdf_export',
            response: {
                success: true,
                message: 'PDF export feature coming soon! For now, you can copy the content from the chat.'
            }
        }
    }

    async handleCalculateDegreeCost(functionCall)
    {
        const args = functionCall.args
        
        try
        {
            const costInfo = await getDegreeCost(args)

            return {
                id: functionCall.id,
                name: 'calculate_degree_cost',
                response: {
                    success: true,
                    costInfo: costInfo
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'calculate_degree_cost',
                response: {
                    success: false,
                    error: error.message || 'Failed to calculate degree cost'
                }
            }
        }
    }

    async handleSearchArticulationDocs(functionCall)
    {
        const args = functionCall.args
        
        try
        {
            const searchResults = await searchCollegeArticulationDocs(args)

            return {
                id: functionCall.id,
                name: 'search_college_articulation_docs',
                response: {
                    success: true,
                    results: searchResults
                }
            }
        }
        catch(error)
        {
            return {
                id: functionCall.id,
                name: 'search_college_articulation_docs',
                response: {
                    success: false,
                    error: error.message || 'Failed to search articulation documents'
                }
            }
        }
    }

    /**
     * Speak the career plan using Eleven Labs TTS
     * @param {string} text - The text to speak
     * @param {string} careerName - The career name for context
     */
    async speakCareerPlan(text, careerName = '')
    {
        try {
            const voiceId = 'bajNon13EdhNMndG3z05'
            
            // Create a more natural speaking text
            const speakingText = careerName 
                ? `I've generated a complete study plan for ${careerName}. ${text}`
                : text
            
            console.log('Chat: Speaking career plan...')
            await elevenLabsService.speak(voiceId, speakingText)
            console.log('Chat: Finished speaking career plan')
        } catch (error) {
            console.error('Chat: Error speaking career plan:', error)
            // Don't show error to user - TTS is optional
        }
    }

    addMessage(type, content)
    {
        if (!this.$messages) return
        
        const messageDiv = document.createElement('div')
        messageDiv.className = `chat-message chat-message--${type}`
        
        const contentDiv = document.createElement('div')
        contentDiv.className = 'chat-message__content'
        contentDiv.textContent = content
        
        messageDiv.appendChild(contentDiv)
        this.$messages.appendChild(messageDiv)
        
        // Scroll to bottom
        this.$messages.scrollTop = this.$messages.scrollHeight
    }

    setLoading(loading)
    {
        this.isLoading = loading
        if (this.$send) this.$send.disabled = loading
        if (this.$input) this.$input.disabled = loading

        if(loading)
        {
            const loadingDiv = document.createElement('div')
            loadingDiv.className = 'chat-message chat-message--bot chat-message--loading'
            loadingDiv.id = 'chat-loading'
            
            const contentDiv = document.createElement('div')
            contentDiv.className = 'chat-message__content'
            contentDiv.textContent = 'Thinking'
            
            loadingDiv.appendChild(contentDiv)
            if (this.$messages) {
                this.$messages.appendChild(loadingDiv)
                this.$messages.scrollTop = this.$messages.scrollHeight
            }
        }
        else
        {
            const loadingDiv = document.getElementById('chat-loading')
            if(loadingDiv)
            {
                loadingDiv.remove()
            }
        }
    }
}

