import type { Course } from "@/lib/courses/types";

/**
 * Intro linear algebra, geometry first: vectors, then matrices as
 * transformations, then the algebra built on that picture. Matrices are
 * written row by row: [[a, b], [c, d]]. Answer keys were checked by script.
 */
export const linearAlgebra: Course = {
  id: "linear-algebra",
  title: "Linear Algebra",
  description: "From arrows to eigenvectors, one picture at a time. 12 lessons.",
  lessons: [
    {
      id: "la-01",
      title: "Vectors: arrows and lists",
      goal: "See a vector as an arrow and as a list of numbers, then add and scale vectors.",
      steps: [
        { id: "s1", kind: "concept", title: "What a vector is", minutes: 8, problems: ["p1"], detail: "A vector is an arrow from the origin; its numbers say how far to go right and up." },
        { id: "s2", kind: "concept", title: "Adding vectors", minutes: 10, problems: ["p2"], detail: "Adding means walking one arrow, then the other: tip to tail, or add matching numbers." },
        { id: "s3", kind: "concept", title: "Scaling vectors", minutes: 8, problems: ["p3"], detail: "Multiplying by a number stretches, shrinks or flips the arrow." },
        { id: "s4", kind: "problem", title: "Practice: add and scale", minutes: 12, problems: ["p4", "p5"], detail: "Combine both moves on a few vectors." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "Explain in your own words what [2, -1] means." },
      ],
      problems: [
        { id: "p1", label: "1", text: "Draw the vector $[3, -2]$. Where does its tip land?", answer: "At the point (3, -2): 3 right, 2 down." },
        { id: "p2", label: "2", text: "$[1, 2] + [3, -1]$", answer: "[4, 1]" },
        { id: "p3", label: "3", text: "$2 \\cdot [-1, 3]$", answer: "[-2, 6]" },
        { id: "p4", label: "4", text: "$3[1, 0] + 2[0, 1]$", answer: "[3, 2]" },
        { id: "p5", label: "5", text: "Find $x$ and $y$ if $[x, 1] + [2, y] = [5, 4]$", answer: "x = 3, y = 3" },
      ],
      notes:
        "Start from the picture: an arrow rooted at the origin. Good widget: a draggable arrow tip that shows its coordinates live; then two draggable arrows drawn tip to tail with their sum. Common mix-ups: treating a vector as a point that can't move, and adding x of one to y of the other.",
    },
    {
      id: "la-02",
      title: "Linear combinations and span",
      goal: "Build new vectors by scaling and adding, and see which vectors you can reach.",
      steps: [
        { id: "s1", kind: "concept", title: "Linear combinations", minutes: 10, problems: ["p1"], detail: "Scale two vectors and add them: a·v + b·w." },
        { id: "s2", kind: "concept", title: "Span of two vectors", minutes: 10, problems: ["p2"], detail: "The span is every vector you can reach this way; in 2D that's usually the whole plane." },
        { id: "s3", kind: "concept", title: "When the span collapses", minutes: 10, problems: ["p3", "p4"], detail: "If one vector is a multiple of the other, you only ever get a line." },
        { id: "s4", kind: "problem", title: "Practice: hit a target", minutes: 12, problems: ["p5"], detail: "Find the right amounts of each vector to reach a target." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "When is the span of two vectors just a line?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "$2[1, 1] + (-1)[0, 3]$", answer: "[2, -1]" },
        { id: "p2", label: "2", text: "Find $a, b$ so that $a[1, 0] + b[0, 1] = [4, 1]$", answer: "a = 4, b = 1" },
        { id: "p3", label: "3", text: "What is the span of $[2, 4]$ and $[1, 2]$?", answer: "The line y = 2x through the origin, since [2, 4] = 2·[1, 2]." },
        { id: "p4", label: "4", text: "Is $[3, 5]$ in the span of $[1, 2]$ alone?", answer: "No. Multiples of [1, 2] have y = 2x, and 5 ≠ 6." },
        { id: "p5", label: "5", text: "Find $a, b$ with $a[1, 1] + b[1, -1] = [5, 1]$", answer: "a = 3, b = 2" },
      ],
      notes:
        "Good widget: two fixed vectors with sliders for a and b, drawing a·v + b·w; a button that scatters many random combinations so the student sees them fill the plane (or a line when the vectors are parallel). Let the student predict before revealing.",
    },
    {
      id: "la-03",
      title: "Linear independence and basis",
      goal: "Tell when vectors are redundant, and use a basis to give every vector coordinates.",
      steps: [
        { id: "s1", kind: "concept", title: "Redundant vectors", minutes: 10, problems: ["p1"], detail: "A vector is redundant if the others can already reach it; otherwise they're independent." },
        { id: "s2", kind: "concept", title: "Basis vectors", minutes: 8, problems: ["p2"], detail: "i-hat and j-hat are the standard basis; any two independent vectors in 2D also work." },
        { id: "s3", kind: "concept", title: "Coordinates in a basis", minutes: 12, problems: ["p3", "p4"], detail: "Coordinates are the amounts of each basis vector you need." },
        { id: "s4", kind: "problem", title: "Practice in 3D", minutes: 10, problems: ["p5"], detail: "Spot redundancy with three vectors." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "Why can't a basis contain a redundant vector?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "Are $[1, 2]$ and $[2, 4]$ independent?", answer: "No, [2, 4] = 2·[1, 2]." },
        { id: "p2", label: "2", text: "Do $[1, 1]$ and $[1, -1]$ form a basis of the plane?", answer: "Yes. Neither is a multiple of the other, so together they span the plane." },
        { id: "p3", label: "3", text: "Write $[5, -3]$ using $\\hat{\\imath}$ and $\\hat{\\jmath}$", answer: "5·i-hat − 3·j-hat" },
        { id: "p4", label: "4", text: "Coordinates of $[5, 1]$ in the basis $[1, 1], [1, -1]$", answer: "(3, 2), since 3·[1, 1] + 2·[1, -1] = [5, 1]." },
        { id: "p5", label: "5", text: "Are $[1,0,0], [0,1,0], [1,1,0]$ independent?", answer: "No. The third is the sum of the first two; all three only span the xy-plane." },
      ],
      notes:
        "Tie back to span: independent means every vector adds a new direction. Good widget: a custom grid drawn from two adjustable basis vectors, with a point whose coordinates in that grid are shown.",
    },
    {
      id: "la-04",
      title: "Matrices as transformations",
      goal: "See a 2x2 matrix as a way of moving the whole plane, read from where i-hat and j-hat land.",
      steps: [
        { id: "s1", kind: "concept", title: "What linear means", minutes: 8, problems: [], detail: "Grid lines stay straight, parallel and evenly spaced, and the origin stays put." },
        { id: "s2", kind: "concept", title: "Columns are landing spots", minutes: 10, problems: ["p1"], detail: "The first column is where i-hat lands, the second is where j-hat lands." },
        { id: "s3", kind: "concept", title: "Matrix times vector", minutes: 12, problems: ["p2", "p3"], detail: "To transform [x, y], take x of the first column plus y of the second." },
        { id: "s4", kind: "problem", title: "Practice: read the motion", minutes: 12, problems: ["p4", "p5"], detail: "Compute outputs and describe what matrices do." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "What would the matrix for doing nothing be?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "i-hat lands on $[2, 1]$, j-hat on $[-1, 3]$. Write the matrix.", answer: "[[2, -1], [1, 3]] (columns [2, 1] and [-1, 3])" },
        { id: "p2", label: "2", text: "$\\begin{bmatrix}2&-1\\\\1&3\\end{bmatrix}\\begin{bmatrix}1\\\\2\\end{bmatrix}$", answer: "[0, 7]" },
        { id: "p3", label: "3", text: "Which matrix rotates the plane 90° counterclockwise?", answer: "[[0, -1], [1, 0]]: i-hat goes to [0, 1], j-hat to [-1, 0]." },
        { id: "p4", label: "4", text: "$\\begin{bmatrix}3&0\\\\0&2\\end{bmatrix}\\begin{bmatrix}4\\\\-1\\end{bmatrix}$", answer: "[12, -2]" },
        { id: "p5", label: "5", text: "Describe what $\\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}$ does to the grid", answer: "A horizontal shear: i-hat stays, j-hat tilts to [1, 1]." },
      ],
      notes:
        "This is the key lesson of the course. Good widget: four sliders for the matrix entries, animating a grid plus i-hat (one color) and j-hat (another) into their new positions, with a test vector. Ask the student to predict where a vector lands before moving the sliders.",
    },
    {
      id: "la-05",
      title: "Matrix multiplication",
      goal: "Multiply matrices by thinking of doing one transformation after another.",
      steps: [
        { id: "s1", kind: "concept", title: "One move, then another", minutes: 8, problems: [], detail: "AB means: do B first, then A." },
        { id: "s2", kind: "concept", title: "Computing a product", minutes: 15, problems: ["p1", "p2"], detail: "Each column of AB is A times the matching column of B." },
        { id: "s3", kind: "concept", title: "Order matters", minutes: 8, problems: ["p3"], detail: "Rotating then shearing isn't the same as shearing then rotating." },
        { id: "s4", kind: "problem", title: "Practice: products", minutes: 12, problems: ["p4"], detail: "Multiply a couple more by hand." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "Why read AB from right to left?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "$A = \\begin{bmatrix}0&-1\\\\1&0\\end{bmatrix}$, $B = \\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}$. Compute $AB$.", answer: "[[0, -1], [1, 1]]" },
        { id: "p2", label: "2", text: "Same $A$ and $B$: compute $BA$.", answer: "[[1, -1], [1, 0]]" },
        { id: "p3", label: "3", text: "Is $AB = BA$ here? What does that tell you?", answer: "No. Order matters: shear-then-rotate differs from rotate-then-shear." },
        { id: "p4", label: "4", text: "$\\begin{bmatrix}2&0\\\\0&3\\end{bmatrix}\\begin{bmatrix}1&4\\\\2&1\\end{bmatrix}$", answer: "[[2, 8], [6, 3]]" },
      ],
      notes:
        "Build on lesson 4: track where i-hat goes under B, then where that goes under A. Good widget: two matrices applied in sequence to a grid, with a swap-order toggle.",
    },
    {
      id: "la-06",
      title: "The determinant",
      goal: "Read the determinant as how much a matrix scales area, and compute it for 2x2 matrices.",
      steps: [
        { id: "s1", kind: "concept", title: "Area scaling", minutes: 10, problems: ["p1"], detail: "The determinant is the factor by which areas grow or shrink." },
        { id: "s2", kind: "concept", title: "Negative determinant", minutes: 6, problems: [], detail: "A negative value means the plane got flipped over." },
        { id: "s3", kind: "concept", title: "Zero determinant", minutes: 8, problems: ["p2"], detail: "Zero means the plane is squished onto a line or a point." },
        { id: "s4", kind: "concept", title: "The 2x2 formula", minutes: 10, problems: ["p3", "p4"], detail: "For [[a, b], [c, d]] the determinant is ad − bc." },
        { id: "s5", kind: "problem", title: "Practice: products", minutes: 8, problems: ["p5"], detail: "See what happens to determinants when you compose." },
      ],
      problems: [
        { id: "p1", label: "1", text: "What does $\\begin{bmatrix}3&0\\\\0&2\\end{bmatrix}$ do to the unit square's area?", answer: "Makes a 3-by-2 rectangle: area 6, so the determinant is 6." },
        { id: "p2", label: "2", text: "$\\det\\begin{bmatrix}1&2\\\\2&4\\end{bmatrix}$ and its meaning", answer: "1·4 − 2·2 = 0: the plane is squished onto a line." },
        { id: "p3", label: "3", text: "$\\det\\begin{bmatrix}2&1\\\\1&3\\end{bmatrix}$", answer: "5" },
        { id: "p4", label: "4", text: "$\\det\\begin{bmatrix}0&1\\\\1&0\\end{bmatrix}$", answer: "−1: area kept, orientation flipped (a reflection)." },
        { id: "p5", label: "5", text: "If $\\det A = 3$ and $\\det B = -2$, find $\\det(AB)$", answer: "−6, because the area scalings multiply." },
      ],
      notes:
        "Good widget: the lesson-4 grid widget plus the unit square shaded, with its area shown live; let the student find a matrix with determinant 0 by dragging.",
    },
    {
      id: "la-07",
      title: "Systems of linear equations",
      goal: "Write systems as Ax = b and solve them by elimination, recognizing when there's no or many solutions.",
      steps: [
        { id: "s1", kind: "concept", title: "Systems as Ax = b", minutes: 8, problems: ["p1"], detail: "A system asks which vector x the matrix A sends to b." },
        { id: "s2", kind: "concept", title: "Elimination", minutes: 12, problems: ["p2"], detail: "Add multiples of one equation to another to knock out a variable." },
        { id: "s3", kind: "concept", title: "One, none or infinitely many", minutes: 10, problems: ["p3", "p4"], detail: "Lines can cross once, never (parallel), or be the same line." },
        { id: "s4", kind: "problem", title: "Practice: back-substitution", minutes: 10, problems: ["p5"], detail: "Solve a 3x3 system from the bottom up." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "How can you tell a system has no solution?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "Write as $A\\mathbf{x} = \\mathbf{b}$: $2x + y = 5$, $x - y = 1$", answer: "A = [[2, 1], [1, -1]], x = [x, y], b = [5, 1]" },
        { id: "p2", label: "2", text: "Solve $2x + y = 5$, $x - y = 1$", answer: "x = 2, y = 1" },
        { id: "p3", label: "3", text: "Solve $x + y = 2$, $2x + 2y = 5$", answer: "No solution: parallel lines." },
        { id: "p4", label: "4", text: "Solve $x + y = 2$, $2x + 2y = 4$", answer: "Infinitely many: it's the same line, x = 2 − y." },
        { id: "p5", label: "5", text: "Solve $x + 2y + z = 4$, $y + z = 3$, $2z = 4$", answer: "z = 2, y = 1, x = 0" },
      ],
      notes:
        "Connect to the picture: each equation is a line, the solution is where they meet. Good widget: two lines from editable coefficients with their intersection marked.",
    },
    {
      id: "la-08",
      title: "Inverse matrices",
      goal: "Undo a transformation with the inverse matrix, and know when that's impossible.",
      steps: [
        { id: "s1", kind: "concept", title: "Undoing a transformation", minutes: 8, problems: [], detail: "The inverse moves everything back: A⁻¹ then A gives the identity." },
        { id: "s2", kind: "concept", title: "When there's no inverse", minutes: 8, problems: ["p1"], detail: "If the determinant is 0, information is lost and can't be undone." },
        { id: "s3", kind: "concept", title: "The 2x2 inverse", minutes: 12, problems: ["p2"], detail: "Swap a and d, negate b and c, divide by the determinant." },
        { id: "s4", kind: "concept", title: "Solving with the inverse", minutes: 10, problems: ["p3"], detail: "If Ax = b, then x = A⁻¹b." },
        { id: "s5", kind: "problem", title: "Practice", minutes: 6, problems: ["p4"], detail: "Invert a simple scaling." },
      ],
      problems: [
        { id: "p1", label: "1", text: "Does $\\begin{bmatrix}2&4\\\\1&2\\end{bmatrix}$ have an inverse?", answer: "No, its determinant is 0." },
        { id: "p2", label: "2", text: "Find the inverse of $\\begin{bmatrix}2&1\\\\5&3\\end{bmatrix}$", answer: "[[3, -1], [-5, 2]] (determinant is 1)" },
        { id: "p3", label: "3", text: "Use it to solve $2x + y = 3$, $5x + 3y = 7$", answer: "x = 2, y = -1" },
        { id: "p4", label: "4", text: "Inverse of $\\begin{bmatrix}4&0\\\\0&\\tfrac12\\end{bmatrix}$", answer: "[[1/4, 0], [0, 2]]" },
      ],
      notes:
        "Ask the student to guess the inverse of simple moves first (rotate 90° → rotate back; scale by 4 → scale by 1/4) before the formula.",
    },
    {
      id: "la-09",
      title: "Column space, null space and rank",
      goal: "Describe what a matrix can output, what it sends to zero, and how many dimensions survive.",
      steps: [
        { id: "s1", kind: "concept", title: "Column space", minutes: 10, problems: ["p1"], detail: "Every possible output Ax: the span of the columns." },
        { id: "s2", kind: "concept", title: "Rank", minutes: 8, problems: ["p2"], detail: "The number of dimensions in the column space." },
        { id: "s3", kind: "concept", title: "Null space", minutes: 10, problems: ["p3"], detail: "All the inputs that get squished onto zero." },
        { id: "s4", kind: "problem", title: "Practice: can we solve it?", minutes: 12, problems: ["p4", "p5"], detail: "Use these ideas to decide if a system has a solution." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "Why does a bigger null space mean a smaller rank?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "Column space of $\\begin{bmatrix}1&2\\\\2&4\\end{bmatrix}$?", answer: "The line through [1, 2] (y = 2x)." },
        { id: "p2", label: "2", text: "Rank of $\\begin{bmatrix}1&2\\\\2&4\\end{bmatrix}$ and of the identity", answer: "1 and 2" },
        { id: "p3", label: "3", text: "Null space of $\\begin{bmatrix}1&2\\\\2&4\\end{bmatrix}$", answer: "All multiples of [-2, 1]." },
        { id: "p4", label: "4", text: "Can $\\begin{bmatrix}1&2\\\\2&4\\end{bmatrix}\\mathbf{x} = [1, 3]$ be solved?", answer: "No: [1, 3] is not on the line y = 2x." },
        { id: "p5", label: "5", text: "A 3x3 matrix has rank 2. What does it do to space? Size of null space?", answer: "Squishes 3D space onto a plane; the null space is a line (dimension 1)." },
      ],
      notes: "Reuse the grid widget: when the determinant is 0, show the output line (column space) and the line of inputs that land on the origin (null space).",
    },
    {
      id: "la-10",
      title: "Dot products and projections",
      goal: "Compute dot products, read what their sign means, and project one vector onto another.",
      steps: [
        { id: "s1", kind: "concept", title: "Computing a dot product", minutes: 8, problems: ["p1"], detail: "Multiply matching components and add." },
        { id: "s2", kind: "concept", title: "What the sign tells you", minutes: 10, problems: ["p2"], detail: "Positive: similar direction. Zero: perpendicular. Negative: opposite-ish." },
        { id: "s3", kind: "concept", title: "Projection onto a line", minutes: 12, problems: ["p3", "p4"], detail: "The shadow of v on u is (v·u / u·u) times u." },
        { id: "s4", kind: "problem", title: "Practice", minutes: 8, problems: ["p5"], detail: "Make two vectors perpendicular." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "What does a dot product of zero mean geometrically?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "$[2, 3] \\cdot [4, -1]$", answer: "5" },
        { id: "p2", label: "2", text: "Are $[1, 2]$ and $[-2, 1]$ perpendicular?", answer: "Yes, the dot product is 0." },
        { id: "p3", label: "3", text: "Project $[3, 4]$ onto $[1, 0]$", answer: "[3, 0]" },
        { id: "p4", label: "4", text: "Project $[2, 2]$ onto $[3, 1]$", answer: "(8/10)·[3, 1] = [2.4, 0.8]" },
        { id: "p5", label: "5", text: "Find $k$ so $[k, 2]$ is perpendicular to $[3, -6]$", answer: "k = 4" },
      ],
      notes: "Good widget: two draggable vectors showing the dot product live and the projection drawn as a shadow; color the dot product by sign.",
    },
    {
      id: "la-11",
      title: "Change of basis",
      goal: "Translate a vector between your coordinates and someone else's basis.",
      steps: [
        { id: "s1", kind: "concept", title: "Different grids", minutes: 10, problems: [], detail: "Someone using other basis vectors describes the same arrow with different numbers." },
        { id: "s2", kind: "concept", title: "Their coordinates to ours", minutes: 12, problems: ["p1"], detail: "Multiply by P, whose columns are their basis vectors." },
        { id: "s3", kind: "concept", title: "Ours to theirs", minutes: 12, problems: ["p2"], detail: "Go the other way with P⁻¹." },
        { id: "s4", kind: "problem", title: "Practice", minutes: 8, problems: ["p3"], detail: "Build P and its inverse." },
        { id: "s5", kind: "review", title: "Check-in", minutes: 5, problems: [], detail: "Why does going back use the inverse?" },
      ],
      problems: [
        { id: "p1", label: "1", text: "Jen's basis: $b_1 = [2, 1]$, $b_2 = [-1, 1]$. Her vector $(1, 2)$ in our coordinates?", answer: "[0, 3]" },
        { id: "p2", label: "2", text: "Our vector $[3, 3]$ in Jen's coordinates?", answer: "(2, 1), since 2·[2, 1] + 1·[-1, 1] = [3, 3]." },
        { id: "p3", label: "3", text: "Write $P$ for Jen's basis and $P^{-1}$", answer: "P = [[2, -1], [1, 1]], P⁻¹ = (1/3)·[[1, 1], [-1, 2]]" },
      ],
      notes: "Good widget: our grid and Jen's grid overlaid in two colors with one draggable point showing both coordinate pairs.",
    },
    {
      id: "la-12",
      title: "Eigenvectors and eigenvalues",
      goal: "Find the special directions a matrix only stretches, and by how much.",
      steps: [
        { id: "s1", kind: "concept", title: "Vectors that stay on their line", minutes: 10, problems: ["p1"], detail: "An eigenvector only gets stretched or flipped: Av = λv." },
        { id: "s2", kind: "concept", title: "Eigenvalues", minutes: 8, problems: ["p2"], detail: "λ is the stretch factor; negative means it flips." },
        { id: "s3", kind: "concept", title: "Finding eigenvalues", minutes: 12, problems: ["p3"], detail: "Solve det(A − λI) = 0." },
        { id: "s4", kind: "concept", title: "Finding eigenvectors", minutes: 10, problems: ["p4"], detail: "For each λ, solve (A − λI)v = 0." },
        { id: "s5", kind: "review", title: "Course wrap-up", minutes: 8, problems: ["p5"], detail: "Connect eigenvectors back to transformations." },
      ],
      problems: [
        { id: "p1", label: "1", text: "Is $[1, 1]$ an eigenvector of $\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}$?", answer: "Yes: A[1, 1] = [3, 3] = 3·[1, 1], eigenvalue 3." },
        { id: "p2", label: "2", text: "Eigenvectors and eigenvalues of $\\begin{bmatrix}2&0\\\\0&3\\end{bmatrix}$", answer: "i-hat with λ = 2, j-hat with λ = 3." },
        { id: "p3", label: "3", text: "Eigenvalues of $\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}$", answer: "(2 − λ)² − 1 = 0, so λ = 1 and λ = 3." },
        { id: "p4", label: "4", text: "Eigenvector of $\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}$ for $\\lambda = 1$", answer: "Multiples of [1, -1]." },
        { id: "p5", label: "5", text: "Does a 90° rotation have real eigenvectors?", answer: "No: every vector is turned off its line; the eigenvalues are ±i." },
      ],
      notes:
        "Good widget: the grid transformation with many arrows from the origin; highlight arrows that stay on their own line. Let the student hunt for eigenvectors by dragging a test vector.",
    },
  ],
};
