module.exports = {
  preset: "ts-jest",
  verbose: true,
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx", "node"],
  testMatch: ["**/tests/**/(*.test|*.spec).ts"],
  collectCoverage: false,
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
};
