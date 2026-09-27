const USERS_KEY = "ethioflight_users"
const CURRENT_USER_KEY = "ethioflight_user"

export function getUsers() {
  const users = localStorage.getItem(USERS_KEY)

  return users ? JSON.parse(users) : []
}

export function signupUser({
  name,
  email,
  password,
}) {
  const users = getUsers()

  const existingUser = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase()
  )

  if (existingUser) {
    throw new Error(
      "An account with this email already exists."
    )
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  )

  const userWithoutPassword = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(userWithoutPassword)
  )

  return userWithoutPassword
}

export function loginUser({
  email,
  password,
}) {
  const users = getUsers()

  const user = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  )

  if (!user) {
    throw new Error(
      "Invalid email or password."
    )
  }

  const loggedInUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(loggedInUser)
  )

  return loggedInUser
}

export function getCurrentUser() {
  const user = localStorage.getItem(
    CURRENT_USER_KEY
  )

  return user ? JSON.parse(user) : null
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}