import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/ask"; // Backend URL

export default function App() {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState("");

    const handleAskAI = async () => {
        const answer = await axios.post(API_URL, { question });
        setResponse(answer.data.response);
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <ScrollView>
                <Text style={{ fontSize: 24, fontWeight: "bold" }}>FastFacts MD</Text>
                <TextInput
                    style={{ height: 40, borderColor: "gray", borderWidth: 1, marginTop: 20 }}
                    placeholder="Ask me anything..."
                    value={question}
                    onChangeText={setQuestion}
                />
                <Button title="Ask AI" onPress={handleAskAI} />
                <Text style={{ marginTop: 20, fontSize: 18 }}>{response}</Text>
            </ScrollView>
        </View>
    );
}

