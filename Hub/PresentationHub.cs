using Microsoft.AspNetCore.SignalR;
using task6.Models;

namespace task6.Hub
{
    public class PresentationHub: Microsoft.AspNetCore.SignalR.Hub
    {
        public List<Presentation> Presentations { get; set; }
        public List<User> Users { get; set; }

        public PresentationHub() 
        {
            
        }

        public async Task Register(string userName)
        {

        }

        public async Task CreatePresentation(string name)
        {

        }

        public async Task AddElement()
        {

        }

        public async Task EditElement()
        {

        }

        public async Task DeleteElement()
        {

        }

        public async Task CreateSlide()
        {

        }

        public async Task DeleteSlide()
        {

        }

        public async Task ChangeUserRole()
        {

        }
    }
}
