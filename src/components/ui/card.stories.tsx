import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Card> = {
    title: "UI/Card",
    component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
    render: () => (
        <div className="p-6 bg-gray-50">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Card title</CardTitle>
                    <CardDescription>Short description goes here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-700">
                        Content area with typical body text. Use CardContent for padding and layout.
                    </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                </CardFooter>
            </Card>
        </div>
    ),
};

