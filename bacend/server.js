const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// Serve static files from the frontend (root project directory)
app.use(express.static(path.join(__dirname, '..')));

// Check if environment variables are set
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('⚠️  NOTE: Twilio credentials not found in .env file');
    console.log('Running in DEMO mode without actual phone calls');
    console.log('For real calls, create .env file with:');
    console.log('TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXX');
    console.log('TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('TWILIO_PHONE_NUMBER=+1234567890');
}

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'demo';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'demo';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

let client;
if (accountSid !== 'demo' && authToken !== 'demo') {
    client = twilio(accountSid, authToken);
}

// In-memory storage for demo (in production, use database)
let users = {};
let calls = [];

// Home route
app.get('/', (req, res) => {
    res.json({
        message: 'BlueCall Backend API',
        version: '2.0.0',
        mode: accountSid === 'demo' ? 'DEMO' : 'PRODUCTION',
        endpoints: {
            home: 'GET /',
            health: 'GET /health',
            register: 'POST /api/register',
            token: 'POST /api/token',
            makeCall: 'POST /api/make-call',
            status: 'GET /api/call-status/:callSid',
            history: 'GET /api/history/:userId',
            settings: 'GET /api/settings/:userId',
            users: 'GET /api/users'
        }
    });
});

// Register new user
app.post('/api/register', (req, res) => {
    try {
        const { username, displayName } = req.body;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username is required'
            });
        }
        
        const userId = `BLUE-USER-${Date.now().toString().slice(-6)}`;
        
        users[userId] = {
            id: userId,
            username: username,
            displayName: displayName || username,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        console.log('👤 New user registered:', userId);
        
        res.json({
            success: true,
            userId: userId,
            user: users[userId]
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate Twilio token
app.post('/api/token', (req, res) => {
    try {
        const { identity } = req.body;
        
        console.log('🔑 Generating token for:', identity || 'anonymous');
        
        // For demo without full Twilio setup
        if (!process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET || accountSid === 'demo') {
            return res.json({
                success: true,
                token: 'demo_token_' + Date.now(),
                identity: identity || 'anonymous',
                mode: 'demo',
                message: 'Running in demo mode. For real calls, configure Twilio API keys.'
            });
        }
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;
        
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_APP_SID || 'APdemo',
            incomingAllow: true
        });
        
        const token = new AccessToken(
            accountSid,
            process.env.TWILIO_API_KEY,
            process.env.TWILIO_API_SECRET,
            { identity: identity || 'user' }
        );
        
        token.addGrant(voiceGrant);
        
        res.json({
            success: true,
            token: token.toJwt(),
            identity: identity || 'user',
            mode: 'production'
        });
        
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Make phone call
app.post('/api/make-call', async (req, res) => {
    try {
        const { toNumber, fromUserId } = req.body;
        
        console.log('📞 Making call to:', toNumber, 'from user:', fromUserId);
        
        if (!toNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number required'
            });
        }
        
        // For demo without actual Twilio call
        if (!client || twilioPhone === '+1234567890') {
            const callId = 'demo_' + Date.now();
            const callRecord = {
                id: callId,
                to: toNumber,
                from: fromUserId || 'unknown',
                status: 'queued',
                createdAt: new Date().toISOString(),
                mode: 'demo'
            };
            
            calls.push(callRecord);
            
            // Simulate call progress
            setTimeout(() => {
                const callIndex = calls.findIndex(c => c.id === callId);
                if (callIndex !== -1) {
                    calls[callIndex].status = 'ringing';
                }
            }, 1000);
            
            setTimeout(() => {
                const callIndex = calls.findIndex(c => c.id === callId);
                if (callIndex !== -1) {
                    calls[callIndex].status = 'in-progress';
                    calls[callIndex].answeredAt = new Date().toISOString();
                }
            }, 3000);
            
            return res.json({
                success: true,
                message: 'Demo call initiated',
                callSid: callId,
                status: 'queued',
                to: toNumber,
                from: twilioPhone,
                mode: 'demo',
                note: 'This is a simulation. Configure Twilio for real calls.'
            });
        }
        
        // Real Twilio call
        const call = await client.calls.create({
            twiml: '<Response><Say>Hello from BlueCall! How can I help you today?</Say></Response>',
            to: toNumber,
            from: twilioPhone
        });
        
        const callRecord = {
            id: call.sid,
            to: toNumber,
            from: fromUserId || 'unknown',
            status: call.status,
            twilioSid: call.sid,
            createdAt: new Date().toISOString(),
            mode: 'production'
        };
        
        calls.push(callRecord);
        
        console.log('✅ Call initiated:', call.sid);
        
        res.json({
            success: true,
            message: 'Call initiated successfully',
            callSid: call.sid,
            status: call.status,
            to: toNumber,
            from: twilioPhone,
            mode: 'production'
        });
        
    } catch (error) {
        console.error('Call error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            note: 'Check Twilio credentials and phone number'
        });
    }
});

// Get call status
app.get('/api/call-status/:callSid', async (req, res) => {
    try {
        const { callSid } = req.params;
        
        // For demo calls
        if (callSid.startsWith('demo_')) {
            const call = calls.find(c => c.id === callSid);
            if (!call) {
                return res.status(404).json({
                    success: false,
                    error: 'Call not found'
                });
            }
            
            // Simulate call duration
            let duration = 0;
            if (call.answeredAt) {
                duration = Math.floor((new Date() - new Date(call.answeredAt)) / 1000);
            }
            
            return res.json({
                success: true,
                status: call.status,
                duration: duration,
                direction: 'outbound',
                from: call.from,
                to: call.to,
                mode: 'demo'
            });
        }
        
        // Real Twilio calls
        if (!client) {
            return res.status(400).json({
                success: false,
                error: 'Twilio not configured'
            });
        }
        
        const call = await client.calls(callSid).fetch();
        
        res.json({
            success: true,
            status: call.status,
            duration: call.duration,
            direction: call.direction,
            from: call.from,
            to: call.to,
            price: call.price,
            mode: 'production'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get call history for user
app.get('/api/history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const userCalls = calls.filter(call => call.from === userId)
                              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                              .slice(0, 50);
        
        res.json({
            success: true,
            calls: userCalls,
            count: userCalls.length,
            userId: userId
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user settings
app.get('/api/settings/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = users[userId];
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Update last seen
        user.lastSeen = new Date().toISOString();
        
        res.json({
            success: true,
            user: user,
            settings: {
                notifications: true,
                soundAlerts: true,
                onlineStatus: true,
                autoAnswer: false,
                videoQuality: 'auto',
                audioQuality: 'auto'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all users (for demo)
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        users: Object.values(users),
        count: Object.keys(users).length
    });
});

// Save user settings
app.post('/api/settings/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const settings = req.body;
        
        if (!users[userId]) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // In production, save to database
        console.log('💾 Saving settings for user:', userId, settings);
        
        res.json({
            success: true,
            message: 'Settings saved successfully',
            userId: userId,
            settings: settings
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        twilioConfigured: !!(accountSid && authToken && accountSid !== 'demo'),
        usersCount: Object.keys(users).length,
        callsCount: calls.length,
        uptime: process.uptime()
    });
});

// Server info
app.get('/info', (req, res) => {
    res.json({
        name: 'BlueCall Backend',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        twilioMode: accountSid === 'demo' ? 'demo' : 'production',
        endpoints: Object.keys(app._router.stack)
            .filter(r => r.route)
            .map(r => Object.keys(r.route.methods)[0].toUpperCase() + ' ' + r.route.path)
    });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📞 Backend API ready`);
    console.log(`🔑 Mode: ${accountSid === 'demo' ? 'DEMO' : 'PRODUCTION'}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /          - API information`);
    console.log(`   GET  /health    - Health check`);
    console.log(`   POST /api/token - Generate Twilio token`);
    console.log(`   POST /api/make-call - Make phone call`);
    console.log(`\n💡 Tip: Open http://localhost:${PORT} in browser to test API`);
});