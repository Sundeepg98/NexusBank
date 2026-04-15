/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, firstName, lastName]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                 account:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     accountNumber:
 *                       type: string
 *                     accountType:
 *                       type: string
 *                     balance:
 *                       type: number
 *       400:
 *         description: User already exists
 *       500:
 *         description: Registration failed
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: Access token (15 min expiry)
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token (7 days expiry)
 *                 refreshTokenExpiry:
 *                   type: integer
 *                   description: Refresh token expiry timestamp
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to blacklist
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *                 refreshTokenExpiry:
 *                   type: integer
 *                   description: Refresh token expiry timestamp
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Failed to refresh token
 */

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 otpId:
 *                   type: string
 *                   description: OTP ID for verification
 *       404:
 *         description: User not found with this email
 *       500:
 *         description: Failed to process request
 */

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpId, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otpId:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or OTP
 *       500:
 *         description: Failed to reset password
 */

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Password must be at least 8 characters with uppercase, lowercase, number and special character
 *       401:
 *         description: Current password is incorrect
 *       500:
 *         description: Failed to change password
 */

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/profile/change-password:
 *   post:
 *     summary: Change password via profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/profile/user:
 *   delete:
 *     summary: Delete user account
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to delete user
 */

/**
 * @openapi
 * /api/accounts:
 *   get:
 *     summary: Get all user accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountType:
 *                     type: string
 *                   balance:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch accounts
 */

/**
 * @openapi
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountType]
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [SAVINGS, CHECKING, CURRENT]
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 accountNumber:
 *                   type: string
 *                 accountType:
 *                   type: string
 *                 balance:
 *                   type: number
 *       400:
 *         description: Invalid account type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create account
 */

/**
 * @openapi
 * /api/accounts/{id}/statement:
 *   get:
 *     summary: Get account statement
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statement
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statement
 *     responses:
 *       200:
 *         description: Account statement retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   type: object
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 */

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Transactions per page
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                       fromAccount:
 *                         type: string
 *                       toAccount:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch transactions
 */

/**
 * @openapi
 * /api/transactions/transfer:
 *   post:
 *     summary: Transfer funds between accounts
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toAccount, amount, description, otp]
 *             properties:
 *               fromAccount:
 *                 type: string
 *                 description: Source account ID (optional, defaults to primary account)
 *               toAccount:
 *                 type: string
 *                 description: Destination account ID or account number
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transactionId:
 *                   type: string
 *       400:
 *         description: Invalid input or insufficient balance
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: OTP verification failed
 *       500:
 *         description: Transfer failed
 */

/**
 * @openapi
 * /api/transactions/generate-otp:
 *   post:
 *     summary: Generate OTP for transfer
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toAccount, amount]
 *             properties:
 *               toAccount:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: OTP generated and sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 otpId:
 *                   type: string
 *                   description: OTP identifier for verification
 *                 expiresIn:
 *                   type: integer
 *                   description: OTP expiry in seconds
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Failed to generate OTP
 */

/**
 * @openapi
 * /api/transactions/verify-otp:
 *   post:
 *     summary: Verify OTP for transfer
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 verified:
 *                   type: boolean
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many failed attempts or OTP locked out
 *       500:
 *         description: Verification failed
 */

/**
 * @openapi
 * /api/beneficiaries:
 *   get:
 *     summary: Get all beneficiaries
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of beneficiaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   nickname:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch beneficiaries
 */

/**
 * @openapi
 * /api/beneficiaries:
 *   post:
 *     summary: Add a new beneficiary
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, accountNumber, bankName]
 *             properties:
 *               name:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       201:
 *         description: Beneficiary added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 accountNumber:
 *                   type: string
 *                 bankName:
 *                   type: string
 *                 nickname:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add beneficiary
 */

/**
 * @openapi
 * /api/beneficiaries/{id}:
 *   put:
 *     summary: Update beneficiary
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Beneficiary ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Beneficiary updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Beneficiary not found
 *       500:
 *         description: Failed to update beneficiary
 */

/**
 * @openapi
 * /api/beneficiaries/{id}:
 *   delete:
 *     summary: Delete beneficiary
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Beneficiary ID
 *     responses:
 *       200:
 *         description: Beneficiary deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Beneficiary not found
 *       500:
 *         description: Failed to delete beneficiary
 */

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 database:
 *                   type: string
 */
