// # 1. Design and implement a basic Binary Tree.
// # 2. Implement given example in the designed structure.
// # 3. Write a function that will return two smallest values in the tree as a list.
// #       5
// #      / \
// #     4   1
// #    / \
// #   2   3

// Define the TreeNode class
class TreeNode {
    value: number;
    left: TreeNode | null;
    right: TreeNode | null;

    constructor(value: number) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

// Binary Tree class
class BinaryTree {
    root: TreeNode | null;

    constructor() {
        this.root = null;
    }

    // Build the example tree with the exact structure
    buildExampleTree(): void {
        //       5
        //      / \
        //     4   1
        //    / \
        //   2   3
        
        this.root = new TreeNode(5);
        this.root.left = new TreeNode(4);
        this.root.right = new TreeNode(1);
        this.root.left.left = new TreeNode(2);
        this.root.left.right = new TreeNode(3);
    }

    // In-order traversal to collect all values
    private inOrderTraversal(node: TreeNode | null, values: number[]): void {
        if (node === null) {
            return;
        }
        
        this.inOrderTraversal(node.left, values);
        values.push(node.value);
        this.inOrderTraversal(node.right, values);
    }

    // Function to find two smallest values in the tree
    findTwoSmallest(): number[] {
        if (this.root === null) {
            return [];
        }

        const values: number[] = [];
        this.inOrderTraversal(this.root, values);

        if (values.length < 2) {
            return values;
        }

        // Sort values to find the two smallest
        values.sort((a, b) => a - b);

        return [values[0], values[1]];
    }

    // Print in-order traversal
    printInOrder(node: TreeNode | null = this.root): void {
        if (node === null) {
            return;
        }
        
        this.printInOrder(node.left);
        process.stdout.write(`${node.value} `);
        this.printInOrder(node.right);
    }

    // Get all values as array
    getAllValues(): number[] {
        const values: number[] = [];
        this.inOrderTraversal(this.root, values);
        return values;
    }

    // Visual representation of the tree
    printTree(node: TreeNode | null = this.root, prefix: string = '', isLeft: boolean = true): void {
        if (node === null) {
            return;
        }

        if (node.right !== null) {
            this.printTree(node.right, prefix + (isLeft ? '│   ' : '    '), false);
        }

        console.log(prefix + (isLeft ? '└── ' : '┌── ') + node.value);

        if (node.left !== null) {
            this.printTree(node.left, prefix + (isLeft ? '    ' : '│   '), true);
        }
    }
}

// Main execution
function main() {
    console.log('=== Binary Tree Implementation (TypeScript) ===\n');

    // Create and build the tree
    const tree = new BinaryTree();
    tree.buildExampleTree();

    console.log('Tree structure:');
    console.log('      5');
    console.log('     / \\');
    console.log('    4   1');
    console.log('   / \\');
    console.log('  2   3\n');

    // Print in-order traversal
    console.log('In-order traversal:');
    tree.printInOrder();
    console.log('\n');

    // Get all values
    const allValues = tree.getAllValues();
    console.log('All values:', allValues);

    // Find two smallest values
    const twoSmallest = tree.findTwoSmallest();
    console.log('\nTwo smallest values in the tree:');
    console.log(`1st smallest: ${twoSmallest[0]}`);
    console.log(`2nd smallest: ${twoSmallest[1]}`);
    console.log(`As a list: [${twoSmallest[0]}, ${twoSmallest[1]}]`);

    // Visual tree representation
    console.log('\nVisual tree representation:');
    tree.printTree();
}

// Run the program
main();

// # 1. Design and implement a basic Binary Tree.
// # 2. Implement given example in the designed structure.
// # 3. Write a function that will return two smallest values in the tree as a list.
// #       5
// #      / \
// #     4   1
// #    / \
// #   2   3