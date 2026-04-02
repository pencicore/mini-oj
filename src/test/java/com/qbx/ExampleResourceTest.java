package com.qbx;

import com.qbx.client.GoJudgeClient;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class ExampleResourceTest {

    @Inject
    GoJudgeClient goJudgeClient;

    //    @Test
    void testHelloEndpoint() {
        given()
                .when().get("/hello")
                .then()
                .statusCode(200)
                .body(is("Hello from Quarkus REST"));
    }

//    @Test
    void testOJClientPython() {
        String code = """
                a, b = map(int, input().split())
                print(a + b)
                print(a + b + a + b)
                """;

        String input = "1 2\n";

        String result = goJudgeClient.runPython(code, input, 1000, 128);

        System.out.println("Python go-judge 返回结果：");
        System.out.println(result);

        assertTrue(!result.contains("Internal Error"), "Python 执行失败: " + result);
        assertTrue(result.contains("3"), "Python 输出不符合预期: " + result);
        assertTrue(result.contains("6"), "Python 输出不符合预期: " + result);
    }

//    @Test
    void testOJClientJava() {
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        java.util.Scanner sc = new java.util.Scanner(System.in);
                        int a = sc.nextInt();
                        int b = sc.nextInt();
                        System.out.println(a + b);
                        System.out.println(a + b + a + b);
                    }
                }
                """;

        String input = "1 2\n";

        String result = goJudgeClient.runJava(code, input, 1000, 256);

        System.out.println("Java go-judge 返回结果：");
        System.out.println(result);

        assertTrue(!result.contains("Internal Error"), "Java 执行失败: " + result);
        assertTrue(result.contains("3"), "Java 输出不符合预期: " + result);
        assertTrue(result.contains("6"), "Java 输出不符合预期: " + result);
    }

    @Test
    void testOJClientCpp() {
        String code = """
                #include <iostream>
                using namespace std;

                int main() {
                    int a, b;
                    cin >> a >> b;
                    cout << a + b << endl;
                    cout << a + b + a + b << endl;
                    return 0;
                }
                """;

        String input = "1 2\n";

        String result = goJudgeClient.runCpp(code, input, 1000, 256);

        System.out.println("C++ go-judge 返回结果：");
        System.out.println(result);

        assertTrue(!result.contains("Internal Error"), "C++ 执行失败: " + result);
        assertTrue(result.contains("3"), "C++ 输出不符合预期: " + result);
        assertTrue(result.contains("6"), "C++ 输出不符合预期: " + result);
    }
}