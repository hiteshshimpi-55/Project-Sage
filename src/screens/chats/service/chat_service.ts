import supabase from '../../../core/supabase';
export class ChatServiceV2{
    public static async get_or_create_chat(current_user_id: string, target_user_id: string) {
        console.log("Get Or Create Chat",current_user_id,target_user_id);
        const {data, error} = await supabase.rpc('get_or_create_chat', {
            current_user_id: current_user_id,
            target_user_id: target_user_id,
        });

        if (error) {
            throw error;
        } else {
            console.log("Get Or Create Chat",data);
            return data;
        }
    }
}