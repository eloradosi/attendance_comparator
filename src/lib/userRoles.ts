/**
 * User Roles Utility
 * 
 * Helper functions for managing and checking user roles
 */

export type UserRole = "admin" | "employee";

/**
 * Get current user's role from sessionStorage
 * @returns User role or null if not found
 */
export function getUserRole(): UserRole | null {
    if (typeof window === "undefined") return null;
    const role = sessionStorage.getItem("userRole");
    return role as UserRole | null;
}

/**
 * Check if current user is an admin
 * @returns true if user has admin role
 */
export function isAdmin(): boolean {
    return getUserRole() === "admin";
}

/**
 * Check if current user is an employee
 * @returns true if user has employee role
 */
export function isEmployee(): boolean {
    return getUserRole() === "employee";
}
