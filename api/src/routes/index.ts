import { Router } from 'express';
import userController from '../controllers/user.controller';
import assignmentController from '../controllers/assignment.controller';
import screentimeController from '../controllers/screentime.controller';
import notificationController from '../controllers/notification.controller';
import insightsController from '../controllers/insights.controller';
import friendsController from '../controllers/friends.controller';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User routes
router.post('/api/register', (req, res) => userController.register(req, res));
router.post('/api/toggle-notifications', (req, res) =>
  userController.toggleNotifications(req, res)
);
router.get('/api/users', (req, res) => userController.getAllUsers(req, res));

// Assignment routes
router.post('/api/assignments', (req, res) =>
  assignmentController.storeAssignments(req, res)
);
router.get('/api/assignments', (req, res) =>
  assignmentController.getAssignments(req, res)
);

// Screentime routes
router.post('/api/screentime', (req, res) =>
  screentimeController.storeScreentime(req, res)
);

// Notification routes
router.post('/api/send-notification', (req, res) =>
  notificationController.sendNotification(req, res)
);

// Insights routes
router.get('/api/insights/:email', (req, res) =>
  insightsController.getInsights(req, res)
);

// Friends routes
router.post('/api/friends/add', (req, res) =>
  friendsController.addFriend(req, res)
);
router.post('/api/friends/remove', (req, res) =>
  friendsController.removeFriend(req, res)
);
router.get('/api/friends/:email', (req, res) =>
  friendsController.getFriends(req, res)
);
router.get('/api/friends/leaderboard/:email', (req, res) =>
  friendsController.getLeaderboard(req, res)
);

export default router;
